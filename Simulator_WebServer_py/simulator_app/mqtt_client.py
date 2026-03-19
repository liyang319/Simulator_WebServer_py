# simulator/mqtt_client.py
import paho.mqtt.client as mqtt
import json
import logging
import threading
from django.conf import settings
from django.utils import timezone
import time

logger = logging.getLogger(__name__)


class SimpleMQTTClient:
    def __init__(self):
        self.client = None
        self.is_connected = False
        self.message_count = 0
        self.recent_messages = []
        self.max_messages = 1000

        # 配置
        self.config = {
            'host': getattr(settings, 'MQTT_BROKER_HOST', 'localhost'),
            'port': getattr(settings, 'MQTT_BROKER_PORT', 1883),
            'username': getattr(settings, 'MQTT_USERNAME', None),
            'password': getattr(settings, 'MQTT_PASSWORD', None),
            'keepalive': 60
        }

        # 订阅主题
        self.subscriptions = [
            'simulator/data/#',
            'simulator/command/#',
            'EtherCAT/Command/+/EscData',
            'EtherCAT/Command/+/ControlData',
            'EtherCAT/Data/+/SampleData'
        ]

    def on_connect(self, client, userdata, flags, rc):
        """连接回调"""
        if rc == 0:
            self.is_connected = True
            logger.info("✅ MQTT客户端连接成功")

            # 订阅主题
            for topic in self.subscriptions:
                client.subscribe(topic)
                logger.info(f"📡 订阅主题: {topic}")
        else:
            logger.error(f"❌ MQTT连接失败，错误码: {rc}")
            self.is_connected = False

    def on_message(self, client, userdata, msg):
        """消息接收回调"""
        try:
            self.message_count += 1
            topic = msg.topic
            payload = msg.payload.decode('utf-8')

            logger.info(f"📨 收到MQTT消息 #{self.message_count}: {topic}")

            # 解析JSON
            try:
                data = json.loads(payload)
            except json.JSONDecodeError:
                logger.warning(f"⚠️ 消息不是JSON格式: {payload}")
                return

            # 处理消息
            self.process_message(topic, data)

            # 存储消息用于页面显示
            self.store_message(topic, data)

        except Exception as e:
            logger.error(f"❌ 处理MQTT消息错误: {e}")

    def process_message(self, topic: str, data: dict):
        """处理MQTT消息"""
        print(data)
        # 新增：处理 EtherCAT/Data/{主站名}/SampleData 主题
        if topic.startswith('EtherCAT/Data/') and topic.endswith('/SampleData'):
            self._handle_ethercat_data(topic, data)

    def _handle_ethercat_data(self, topic: str, data: dict):
        """处理 EtherCAT 采样数据，更新输入模块的当前数值（支持任意数量模块）"""
        try:
            # 提取主站名（主题格式：EtherCAT/Data/{master_name}/SampleData）
            parts = topic.split('/')
            if len(parts) != 4:
                logger.error(f"无效的 EtherCAT 主题格式: {topic}")
                return
            master_name = parts[2]

            # 导入模型（避免循环导入）
            from .models import Master, Module, Signal

            # 查找主站（假设 name 字段匹配）
            try:
                master = Master.objects.get(name=master_name)
            except Master.DoesNotExist:
                logger.error(f"未找到主站: {master_name}")
                return

            # 获取该主站下的所有输入模块，按 slot 排序
            input_modules = Module.objects.filter(
                master=master,
                type__in=['16DI', '08AI']
            ).order_by('slot')

            if not input_modules.exists():
                logger.warning(f"主站 {master_name} 下没有输入模块")
                return

            # 取第一组采样数据（键 "0"）
            first_group_key = '0'
            if first_group_key not in data:
                logger.warning(f"消息中缺少键 '{first_group_key}'")
                return
            first_group = data[first_group_key]

            # 第一组数据应为 [[module1_data, module2_data, ...]] 的结构
            if not isinstance(first_group, list) or len(first_group) == 0:
                logger.error(f"第一组数据格式错误: {first_group}")
                return
            modules_data_list = first_group[0]  # 这是包含所有模块数据的列表
            if not isinstance(modules_data_list, list):
                logger.error(f"模块数据列表格式错误: {modules_data_list}")
                return

            # 检查模块数据数量是否与数据库中的输入模块数量一致
            module_count = input_modules.count()
            if len(modules_data_list) != module_count:
                logger.error(
                    f"主站 {master_name} 模块数据数量 ({len(modules_data_list)}) "
                    f"与数据库模块数量 ({module_count}) 不匹配"
                )
                return

            # 按顺序处理每个模块
            for i, module in enumerate(input_modules):
                module_data = modules_data_list[i]
                self._update_module_signals(module, module_data)

        except Exception as e:
            logger.error(f"处理 EtherCAT 数据时发生异常: {e}", exc_info=True)

    def _update_module_signals(self, module, data_values):
        """根据模块类型和数据更新该模块下所有信号的 current_value"""
        from .models import Signal
        import logging

        module_type = module.type
        signals = Signal.objects.filter(module=module).order_by('channel')
        if not signals.exists():
            logger.warning(f"模块 {module.code} 下没有信号")
            return

        # 根据模块类型校验数据长度
        if module_type == '08AI':
            expected_len = 9  # 08AI 数据长度固定为 9，前8个有效，第9个预留
            if not isinstance(data_values, list):
                logger.error(f"模块 {module.code} 数据应为列表，实际: {type(data_values)}")
                return
            if len(data_values) != expected_len:
                logger.error(f"模块 {module.code} 数据长度错误，期望 {expected_len}，实际 {len(data_values)}")
                return
            # 取前 8 个数据赋值给通道
            for i, signal in enumerate(signals):
                if i < 8:  # 确保不超过前8个通道
                    signal.current_value = data_values[i]
                    signal.save(update_fields=['current_value'])
                else:
                    # 如果信号超过8个（理论上不会），则忽略
                    break

        elif module_type == '16DI':
            expected_len = 1
            if not isinstance(data_values, list):
                logger.error(f"模块 {module.code} 数据应为列表，实际: {type(data_values)}")
                return
            if len(data_values) != expected_len:
                logger.error(f"模块 {module.code} 数据长度错误，期望 {expected_len}，实际 {len(data_values)}")
                return
            # 16DI：一个数值，按位解析为16个通道
            value = data_values[0]
            try:
                int_val = int(float(value))  # 可能为浮点数，取整
            except (ValueError, TypeError):
                logger.error(f"模块 {module.code} 数据无法转换为整数: {value}")
                return
            for i, signal in enumerate(signals):
                bit = (int_val >> i) & 1
                signal.current_value = bit
                signal.save(update_fields=['current_value'])
                logger.info(f"更新信号 {signal.code} current_value = {bit if module_type == '16DI' else data_values[i]}")
        else:
            logger.warning(f"未知模块类型: {module_type}")



    def store_message(self, topic: str, data: dict):
        """存储消息用于页面显示"""
        message_type = 'batch_tags' if data.get('command') == 'report_tags' else 'simulator_data'

        message = {
            'id': self.message_count,
            'topic': topic,
            'data': data,
            'timestamp': timezone.now().isoformat(),
            'type': message_type
        }

        self.recent_messages.append(message)

        # 限制消息数量
        if len(self.recent_messages) > self.max_messages:
            self.recent_messages = self.recent_messages[-self.max_messages:]

    def extract_device_id(self, topic: str) -> str:
        """从主题中提取设备ID"""
        parts = topic.split('/')
        if len(parts) >= 2:
            print(f'deviceid = {parts[2]}')
            return parts[2]
        return 'unknown'

    def get_recent_messages(self, limit=50, message_type=None):
        """获取最近的消息"""
        messages = self.recent_messages

        if message_type:
            messages = [msg for msg in messages if msg['type'] == message_type]

        return messages[-limit:]

    def get_statistics(self):
        """获取统计信息"""
        return {
            'total_messages': self.message_count,
            'recent_messages_count': len(self.recent_messages),
            'connected': self.is_connected,
            'last_update': timezone.now().isoformat()
        }

    def publish_message(self, topic: str, message: dict):
        """发布消息到MQTT Broker"""
        if self.is_connected and self.client:
            try:
                result = self.client.publish(topic, json.dumps(message))
                if result.rc == mqtt.MQTT_ERR_SUCCESS:
                    logger.info(f"📤 发布消息到: {topic}")
                    return True
                else:
                    logger.error(f"❌ 发布消息失败: {result.rc}")
                    return False
            except Exception as e:
                logger.error(f"❌ 发布消息错误: {e}")
                return False
        return False

    def connect(self):
        """连接MQTT Broker"""
        try:
            self.client = mqtt.Client()
            self.client.on_connect = self.on_connect
            self.client.on_message = self.on_message

            # 设置认证（如果需要）
            if self.config['username'] and self.config['password']:
                self.client.username_pw_set(
                    self.config['username'],
                    self.config['password']
                )

            # 连接
            self.client.connect(
                self.config['host'],
                self.config['port'],
                self.config['keepalive']
            )

            # 启动网络循环（非阻塞）
            self.client.loop_start()

            logger.info(f"🔗 连接MQTT Broker: {self.config['host']}:{self.config['port']}")
            return True

        except Exception as e:
            logger.error(f"❌ 连接MQTT Broker失败: {e}")
            return False

    def disconnect(self):
        """断开连接"""
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            self.is_connected = False
            logger.info("🔌 MQTT连接已断开")


# 全局实例
mqtt_client = SimpleMQTTClient()