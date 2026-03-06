# simulator_app/views.py
from django.shortcuts import render
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Cabinet, Master, Slave, Module, Signal, Project
from .serializers import (
    CabinetSerializer, MasterSerializer, SlaveSerializer,
    ModuleSerializer, SignalSerializer, ProjectSerializer
)

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