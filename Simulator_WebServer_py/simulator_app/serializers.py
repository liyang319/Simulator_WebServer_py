# simulator_app/serializers.py
from rest_framework import serializers
from .models import Cabinet, Master, Slave, Module, Signal, Project

class CabinetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cabinet
        fields = '__all__'

class MasterSerializer(serializers.ModelSerializer):
    cabinet = serializers.PrimaryKeyRelatedField(queryset=Cabinet.objects.all())
    class Meta:
        model = Master
        fields = '__all__'

class SlaveSerializer(serializers.ModelSerializer):
    cabinet = serializers.PrimaryKeyRelatedField(queryset=Cabinet.objects.all())
    master = serializers.PrimaryKeyRelatedField(queryset=Master.objects.all())
    class Meta:
        model = Slave
        fields = '__all__'

class ModuleSerializer(serializers.ModelSerializer):
    cabinet = serializers.PrimaryKeyRelatedField(queryset=Cabinet.objects.all())
    master = serializers.PrimaryKeyRelatedField(queryset=Master.objects.all())
    slave = serializers.PrimaryKeyRelatedField(queryset=Slave.objects.all())
    class Meta:
        model = Module
        fields = '__all__'

class SignalSerializer(serializers.ModelSerializer):
    cabinet = serializers.PrimaryKeyRelatedField(queryset=Cabinet.objects.all())
    master = serializers.PrimaryKeyRelatedField(queryset=Master.objects.all())
    slave = serializers.PrimaryKeyRelatedField(queryset=Slave.objects.all())
    module = serializers.PrimaryKeyRelatedField(queryset=Module.objects.all())
    class Meta:
        model = Signal
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    signals = serializers.PrimaryKeyRelatedField(many=True, queryset=Signal.objects.all())
    class Meta:
        model = Project
        fields = '__all__'

class MqttPublishSerializer(serializers.Serializer):
    project_id = serializers.CharField(required=True)
    action = serializers.ChoiceField(choices=['start', 'view'], required=True)