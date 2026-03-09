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
        'DI': {
            "ioType": 1,
            "slot": 1,
            "orderNumber": 506101,
            "inputLength": 2,
            "outputLength": 0,
            "parameters": [{"filter": 1, "invertByte1": 0, "invertByte2": 0}]
        },
        'DO': {
            "ioType": 2,
            "slot": 2,
            "orderNumber": 506102,
            "inputLength": 0,
            "outputLength": 2,
            "parameters": [{"enableOutputPresetValue": 0, "presentByte1": 0, "presentByte2": 0}]
        },
        'AI': {
            "ioType": 12,
            "slot": 4,
            "orderNumber": 506112,
            "inputLength": 18,
            "outputLength": 0,
            "parameters": [{"mode": 2, "singleOrDifferential": 1, "filter": 0}] * 8
        },
        'AO': {
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
    """下发指定主站下所有从站及模块的配置"""
    try:
        master = Master.objects.get(id=master_id)
    except Master.DoesNotExist:
        return Response({'error': 'Master not found'}, status=status.HTTP_404_NOT_FOUND)

    cabinet_id = master.cabinet_id
    slaves = master.slaves.all()
    if not slaves:
        return Response({'warning': 'No slaves under this master'}, status=status.HTTP_200_OK)

    # 构建配置数据
    config_data = {
        'master': {
            'id': master.id,
            'code': master.code,
            'name': master.name,
            'ip': master.ip,
            'port': master.port,
        },
        'slaves': []
    }

    for slave in slaves:
        slave_data = {
            'id': slave.id,
            'code': slave.code,
            'name': slave.name,
            'address': slave.address,
            'protocol': slave.protocol,
            'modules': []
        }
        for module in slave.modules.all():
            module_data = {
                'id': module.id,
                'code': module.code,
                'name': module.name,
                'type': module.type,
                'channels': module.channels,
                'config': get_module_default_config(module)  # 动态生成配置
            }
            slave_data['modules'].append(module_data)
        config_data['slaves'].append(slave_data)

    # 通过 MQTT 发布
    topic = f"simulator/command/{cabinet_id}/{master_id}"
    if mqtt_client.publish_message(topic, config_data):
        return Response({
            'success': True,
            'message': 'Configuration deployed',
            'topic': topic
        })
    else:
        return Response({'error': 'MQTT publish failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
