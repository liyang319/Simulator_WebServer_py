# rfid_app/mqtt_client.py
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
            'rfid/data/#'
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
        try:
            # 检查是否是批量标签数据格式
            if data.get('command') == 'report_tags':
                self.handle_batch_tags(topic, data)
            elif 'rfid/data' in topic:
                self.handle_rfid_data(topic, data)
            elif 'rfid/status' in topic:
                self.handle_device_status(topic, data)
            else:
                logger.warning(f"⚠️ 未知消息主题: {topic}")

        except Exception as e:
            logger.error(f"❌ 处理消息错误: {e}")

    def handle_batch_tags(self, topic: str, data: dict):
        """处理批量标签数据"""
        try:
            # 提取设备ID
            device_id = self.extract_device_id(topic) or data.get('reader_id', 'unknown')
            data_type = data.get('data_type', 'unknown')
            tags = data.get('tags', [])

            logger.info(f"📦 收到批量标签数据: {len(tags)}个标签 - 类型: {data_type} - 设备: {device_id}")

            # 处理每个标签
            processed_count = 0
            for tag_data in tags:
                if self.process_single_tag(device_id, tag_data, data_type):
                    processed_count += 1

            # 更新设备状态
            self.update_device_status(device_id, 'online', data)

            logger.info(f"✅ 批量处理完成: {processed_count}/{len(tags)}个标签")

        except Exception as e:
            logger.error(f"❌ 处理批量标签数据错误: {e}")

    def process_single_tag(self, device_id: str, tag_data: dict, data_type: str):
        """处理单个标签数据"""
        try:
            # 转换时间格式
            timestamp_str = tag_data.get('timestamp')
            if timestamp_str:
                try:
                    from datetime import datetime
                    timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                    timestamp = timezone.make_aware(timestamp)
                except ValueError:
                    timestamp = timezone.now()
            else:
                timestamp = timezone.now()

            # 保存到数据库
            self.save_rfid_data(device_id, tag_data, timestamp, data_type)
            return True

        except Exception as e:
            logger.error(f"❌ 处理单个标签错误: {e}")
            return False

    def handle_rfid_data(self, topic: str, data: dict):
        """处理RFID数据"""
        try:
            # 提取设备ID
            device_id = self.extract_device_id(topic) or data.get('reader_id', 'unknown')

            # 保存到数据库
            self.save_rfid_data(device_id, data, timezone.now(), 'single')

            # 更新设备状态
            self.update_device_status(device_id, 'online', data)

            logger.info(f"🏷️ 处理RFID数据: {data.get('tag_id', 'unknown')} - 设备: {device_id}")

        except Exception as e:
            logger.error(f"❌ 处理RFID数据错误: {e}")

    def handle_device_status(self, topic: str, data: dict):
        """处理设备状态"""
        try:
            device_id = self.extract_device_id(topic) or data.get('device_id', 'unknown')
            status = data.get('status', 'online')

            self.update_device_status(device_id, status, data)
            logger.info(f"📊 设备状态更新: {device_id} - {status}")

        except Exception as e:
            logger.error(f"❌ 处理设备状态错误: {e}")

    def save_rfid_data(self, device_id: str, data: dict, timestamp, data_type='single'):
        """保存RFID数据到数据库"""
        try:
            print('save_rfid_data')

        except Exception as e:
            logger.error(f"❌ 保存RFID数据错误: {e}")

    def update_device_status(self, device_id: str, status: str, data: dict):
        """更新设备状态"""
        try:
            print('update_device_status')
        except Exception as e:
            logger.error(f"❌ 更新设备状态错误: {e}")

    def store_message(self, topic: str, data: dict):
        """存储消息用于页面显示"""
        message_type = 'batch_tags' if data.get('command') == 'report_tags' else 'rfid_data'

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

    def send_command(self, device_id: str, command: str, parameters: dict = None):
        """发送命令到设备"""
        command_msg = {
            'command': command,
            'command_id': f"web_cmd_{int(time.time() * 1000)}",
            'parameters': parameters or {},
            'timestamp': timezone.now().isoformat(),
            'sent_by': 'web_interface'
        }

        topic = f"rfid/{device_id}/command"
        return self.publish_message(topic, command_msg)

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