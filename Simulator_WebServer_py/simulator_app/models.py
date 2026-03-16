# simulator_app/models.py
from django.db import models


class Cabinet(models.Model):
    id = models.CharField(max_length=50, primary_key=True)  # 若希望前端生成ID则保留，否则可改用AutoField
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='online')
    create_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class Master(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    cabinet = models.ForeignKey(Cabinet, on_delete=models.CASCADE, related_name='masters')
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    ip = models.GenericIPAddressField()
    port = models.IntegerField()
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='online')
    create_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class Slave(models.Model):
    # PROTOCOL_CHOICES = [
    #     ('MODBUS_RTU', 'MODBUS RTU'),
    #     ('MODBUS_TCP', 'MODBUS TCP'),
    #     ('PROFIBUS', 'PROFIBUS'),
    #     ('PROFINET', 'PROFINET'),
    # ]
    SLAVE_TYPE_CHOICES = [
        ('S1-EC20', 'S1-EC20'),
        ('S1-M20', 'S1-M20'),
    ]
    slave_type = models.CharField(max_length=50, choices=SLAVE_TYPE_CHOICES, default='S1-EC20')
    id = models.CharField(max_length=50, primary_key=True)
    cabinet = models.ForeignKey(Cabinet, on_delete=models.CASCADE, related_name='slaves')
    master = models.ForeignKey(Master, on_delete=models.CASCADE, related_name='slaves')
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    # address = models.IntegerField()
    # protocol = models.CharField(max_length=20, choices=PROTOCOL_CHOICES)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='online')
    create_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class Module(models.Model):
    TYPE_CHOICES = [
        ('16DI', '16DI'),
        ('16DO', '16DO'),
        ('08AI', '08AI'),
        ('08AO', '08AO'),
    ]
    id = models.CharField(max_length=50, primary_key=True)
    cabinet = models.ForeignKey(Cabinet, on_delete=models.CASCADE, related_name='modules')
    master = models.ForeignKey(Master, on_delete=models.CASCADE, related_name='modules')
    slave = models.ForeignKey(Slave, on_delete=models.CASCADE, related_name='modules')
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    slot = models.IntegerField(default=1)  # 默认插槽1，范围1-16
    channels = models.IntegerField()
    parameters = models.JSONField(default=dict, blank=True)  # 新增字段
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='online')
    create_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class Signal(models.Model):
    TYPE_CHOICES = [
        ('AI', '模拟量输入(AI)'),
        ('AO', '模拟量输出(AO)'),
        ('DI', '数字量输入(DI)'),
        ('DO', '数字量输出(DO)'),
        ('RTD', '温度(RTD)'),
        ('TC', '热电偶(TC)'),
        ('PO', '脉冲输出(PO)'),
    ]
    id = models.CharField(max_length=50, primary_key=True)
    cabinet = models.ForeignKey(Cabinet, on_delete=models.CASCADE, related_name='signals')
    master = models.ForeignKey(Master, on_delete=models.CASCADE, related_name='signals')
    slave = models.ForeignKey(Slave, on_delete=models.CASCADE, related_name='signals')
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='signals')
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    channel = models.IntegerField()
    unit = models.CharField(max_length=20, blank=True)
    range_min = models.FloatField(null=True, blank=True)
    range_max = models.FloatField(null=True, blank=True)
    current_value = models.FloatField(null=True, blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='online')
    create_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class Project(models.Model):
    id = models.CharField(max_length=50, primary_key=True)  # 保持与前端的 ID 生成方式一致
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    signals = models.ManyToManyField('Signal', related_name='projects', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


from django.db import models

# Create your models here.
