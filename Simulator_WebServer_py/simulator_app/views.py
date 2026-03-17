# simulator_app/views.py
from django.shortcuts import render
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Cabinet, Master, Slave, Module, Signal, Project
from .serializers import (
    CabinetSerializer, MasterSerializer, SlaveSerializer,
    ModuleSerializer, SignalSerializer, ProjectSerializer
)
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from django.utils import timezone
from .serializers import MqttPublishSerializer
from .mqtt_client import mqtt_client
import logging

logger = logging.getLogger(__name__)

# ====== API 视图集（步骤四）======

class CabinetViewSet(viewsets.ModelViewSet):
    queryset = Cabinet.objects.all()
    serializer_class = CabinetSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['code', 'name', 'location']

class MasterViewSet(viewsets.ModelViewSet):
    queryset = Master.objects.all()
    serializer_class = MasterSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['cabinet_id']
    search_fields = ['code', 'name', 'ip']

class SlaveViewSet(viewsets.ModelViewSet):
    queryset = Slave.objects.all()
    serializer_class = SlaveSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['cabinet_id', 'master_id']
    search_fields = ['code', 'name']

class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['cabinet_id', 'master_id', 'slave_id']
    search_fields = ['code', 'name', 'type']

class SignalViewSet(viewsets.ModelViewSet):
    queryset = Signal.objects.all()
    serializer_class = SignalSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['cabinet_id', 'master_id', 'slave_id', 'module_id']
    search_fields = ['code', 'name', 'type']

    def list(self, request, *args, **kwargs):
        # 在返回列表前，先同步信号
        sync_signals_from_modules()
        return super().list(request, *args, **kwargs)

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

# ====== 前端页面视图（步骤六）======

def management_view(request):
    """渲染设备管理页面"""
    return render(request, 'simulator_app/management.html')

@csrf_exempt
@api_view(['POST'])
def publish_mqtt(request):
    """接收前端请求，通过 MQTT 发布工程信息"""
    serializer = MqttPublishSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    project_id = serializer.validated_data['project_id']
    action = serializer.validated_data['action']

    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

    # 获取工程关联的信号
    signals = project.signals.all()
    if not signals:
        return Response({'warning': 'No signals in this project'}, status=status.HTTP_200_OK)

    # 收集每个信号对应的机柜和主站（去重）
    pairs = set()
    signal_names = []
    module_names = set()
    for signal in signals:
        signal_names.append(signal.name)
        module = signal.module
        if module:
            module_names.add(module.name)
            pairs.add((module.cabinet_id, module.master_id))
        else:
            logger.warning(f"Signal {signal.id} has no module")

    # 构建消息负载
    payload = {
        'action': action,
        'projectName': project.name,
        'signalNames': signal_names,
        'moduleNames': list(module_names),
        'timestamp': str(timezone.now()),
    }

    # 发送 MQTT 消息到每个对
    sent_count = 0
    for cabinet_id, master_id in pairs:
        topic = f"simulator/command/{cabinet_id}/{master_id}"
        if mqtt_client.publish_message(topic, payload):
            sent_count += 1
        else:
            logger.error(f"Failed to publish to {topic}")

    return Response({
        'success': True,
        'sent': sent_count,
        'total': len(pairs),
        'payload': payload,
    }, status=status.HTTP_200_OK)

def get_module_default_config(module):
    """根据模块类型返回默认配置字典"""
    configs = {
        '16DI': {
            "ioType": 1,
            "slot": 1,
            "orderNumber": 506101,
            "inputLength": 2,
            "outputLength": 0,
            "parameters": [{"filter": 1, "invertByte1": 0, "invertByte2": 0}]
        },
        '16DO': {
            "ioType": 2,
            "slot": 2,
            "orderNumber": 506102,
            "inputLength": 0,
            "outputLength": 2,
            "parameters": [{"enableOutputPresetValue": 0, "presentByte1": 0, "presentByte2": 0}]
        },
        '08AI': {
            "ioType": 12,
            "slot": 4,
            "orderNumber": 506112,
            "inputLength": 18,
            "outputLength": 0,
            "parameters": [{"mode": 2, "singleOrDifferential": 1, "filter": 0}] * 8
        },
        '08AO': {
            "ioType": 13,
            "slot": 3,
            "orderNumber": 506113,
            "inputLength": 8,
            "outputLength": 16,
            "parameters": [{"mode": 1, "range": 0, "current": 0}] * 8
        },
    }
    return configs.get(module.type, {})

@api_view(['POST'])
def deploy_master_config(request, master_id):
    """下发指定主站下所有从站及模块的配置（新格式）"""
    try:
        master = Master.objects.get(id=master_id)
    except Master.DoesNotExist:
        return Response({'error': 'Master not found'}, status=status.HTTP_404_NOT_FOUND)

    cabinet_id = master.cabinet_id
    slaves = master.slaves.all().order_by('id')  # 改为按 id 排序（或按 code）
    if not slaves:
        return Response({'warning': 'No slaves under this master'}, status=status.HTTP_200_OK)

    config_data = {
        "version": "0.01",
        "slaves": []
    }

    for position, slave in enumerate(slaves):  # position 从0开始
        # 根据从站类型推断产品代码（目前只有 S1-EC20，但保留逻辑）
        if slave.slave_type == 'S1-EC20':
            product_code = 701102003
            slave_type = 'S1-EC20'
        else:
            product_code = 701102001  # 默认或备用
            slave_type = 'S1-M20'

        slave_data = {
            "alias": 0,
            "position": position,
            "slaveName": slave.name or slave.code,
            "slaveType": slave_type,
            "vendorId": 2877,
            "productCode": product_code,
            "revision": 1,
            "ioModules": []
        }

        # 获取该从站下的所有模块，按插槽（slot）排序
        modules = slave.modules.all().order_by('slot')
        for module in modules:
            # 根据模块类型映射 ioType
            io_type_map = {
                '16DI': 1,
                '16DO': 2,
                '08AI': 12,
                '08AO': 13,
            }
            io_type = io_type_map.get(module.type, 0)

            # 根据 ioType 获取订单号
            order_map = {
                1: 506101,
                2: 506102,
                12: 506112,
                13: 506113,
            }
            order_number = order_map.get(io_type, 0)

            # 根据 ioType 获取输入/输出长度
            if io_type == 1:      # 16DI
                input_len, output_len = 2, 0
            elif io_type == 2:    # 16DO
                input_len, output_len = 0, 2
            elif io_type == 12:   # 08AI
                input_len, output_len = 18, 0
            elif io_type == 13:   # 08AO
                input_len, output_len = 8, 16
            else:
                input_len, output_len = 0, 0

            # 获取模块参数，如果未存储则使用默认值
            parameters = module.parameters
            print(f"Module {module.id} parameters: {module.parameters}")
            if not parameters:
                if module.type == '16DI':
                    parameters = [{"filter": 1, "invertByte1": 0, "invertByte2": 0}]
                elif module.type == '16DO':
                    parameters = [{"enableOutputPresetValue": 0, "presentByte1": 0, "presentByte2": 0}]
                elif module.type == '08AI':
                    parameters = [{"mode": 2, "singleOrDifferential": 1, "filter": 0}] * 8
                elif module.type == '08AO':
                    parameters = [{"mode": 1, "range": 0, "current": 0}] * 8
                else:
                    parameters = []

            module_data = {
                "ioType": io_type,
                "slot": module.slot or 1,  # 使用模块的 slot 字段
                "orderNumber": order_number,
                "inputLength": input_len,
                "outputLength": output_len,
                "parameters": parameters
            }
            slave_data["ioModules"].append(module_data)

        config_data["slaves"].append(slave_data)

    # 通过 MQTT 发布
    topic = f"simulator/command/{cabinet_id}/{master.id}"
    if mqtt_client.publish_message(topic, config_data):
        return Response({
            'success': True,
            'message': 'Configuration deployed',
            'topic': topic
        })
    else:
        return Response({'error': 'MQTT publish failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def sync_signals_from_modules():
    modules = Module.objects.all()
    for module in modules:
        type_map = {
            '16DI': {'channels': 16, 'category': 'static'},
            '08AI': {'channels': 8, 'category': 'static'},
            '16DO': {'channels': 16, 'category': 'dynamic'},
            '08AO': {'channels': 8, 'category': 'dynamic'},
        }
        info = type_map.get(module.type)
        if not info:
            continue

        channels = info['channels']
        category = info['category']

        for ch in range(1, channels + 1):
            signal_code = f"{module.code}-CH{ch:02d}"
            signal_name = f"{module.name} 通道{ch}"
            # 生成唯一 ID，避免空字符串冲突
            signal_id = f"{module.id}-{ch}"

            signal, created = Signal.objects.get_or_create(
                module=module,
                channel=ch,
                defaults={
                    'id': signal_id,  # 新增：提供唯一 ID
                    'cabinet': module.cabinet,
                    'master': module.master,
                    'slave': module.slave,
                    'code': signal_code,
                    'name': signal_name,
                    'type': module.type,
                    'category': category,
                    'unit': '',
                    'range_min': None,
                    'range_max': None,
                    'current_value': None,
                    'setpoint': None,
                    'description': '',
                    'status': 'online',
                }
            )
            if created:
                logger.info(f"Created signal {signal_code} for module {module.code}")
