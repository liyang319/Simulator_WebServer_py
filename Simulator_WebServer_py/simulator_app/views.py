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
