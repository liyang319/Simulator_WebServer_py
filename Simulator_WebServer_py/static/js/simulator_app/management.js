// 全局变量
let currentData = {
    cabinets: [],
    masters: [],
    slaves: [],
    modules: [],
    signals: []
};

let deleteInfo = {
    type: '',
    id: '',
    name: ''
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    initData();
    loadAllData();
    updateTime();
    setInterval(updateTime, 1000);

    // 初始化下拉框
    initFilterSelects();

    // 监听模态框关闭事件
    const modals = ['cabinetModal', 'masterModal', 'slaveModal', 'moduleModal', 'signalModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        modal.addEventListener('hidden.bs.modal', function () {
            const form = document.getElementById(modalId.replace('Modal', 'Form'));
            if (form) form.reset();
        });
    });
});

// 初始化数据（如果没有数据，创建示例数据）
function initData() {
    if (!localStorage.getItem('deviceManagementData')) {
        const sampleData = {
            cabinets: [
                { id: '1', code: 'CAB001', name: '主控机柜', location: '中央控制室', description: '主控制机柜', status: 'online', createTime: '2024-01-01 08:00:00' },
                { id: '2', code: 'CAB002', name: '现场机柜1', location: '生产车间A区', description: '生产现场机柜', status: 'online', createTime: '2024-01-02 09:00:00' },
                { id: '3', code: 'CAB003', name: '现场机柜2', location: '生产车间B区', description: '生产现场机柜', status: 'offline', createTime: '2024-01-03 10:00:00' }
            ],
            masters: [
                { id: '1', cabinetId: '1', code: 'MST001', name: 'PLC主站1', ip: '192.168.1.100', port: 502, description: 'PLC控制主站', status: 'online', createTime: '2024-01-01 08:30:00' },
                { id: '2', cabinetId: '1', code: 'MST002', name: 'PLC主站2', ip: '192.168.1.101', port: 503, description: 'PLC控制主站', status: 'online', createTime: '2024-01-01 09:00:00' },
                { id: '3', cabinetId: '2', code: 'MST003', name: '现场主站1', ip: '192.168.1.102', port: 502, description: '现场控制主站', status: 'online', createTime: '2024-01-02 09:30:00' }
            ],
            slaves: [
                { id: '1', cabinetId: '1', masterId: '1', code: 'SLV001', name: 'IO从站1', address: 1, protocol: 'MODBUS_TCP', description: '数字量IO从站', status: 'online', createTime: '2024-01-01 09:00:00' },
                { id: '2', cabinetId: '1', masterId: '1', code: 'SLV002', name: 'IO从站2', address: 2, protocol: 'MODBUS_TCP', description: '模拟量IO从站', status: 'online', createTime: '2024-01-01 09:30:00' },
                { id: '3', cabinetId: '2', masterId: '3', code: 'SLV003', name: '现场从站1', address: 1, protocol: 'MODBUS_RTU', description: '现场控制从站', status: 'online', createTime: '2024-01-02 10:00:00' }
            ],
            modules: [
                { id: '1', cabinetId: '1', masterId: '1', slaveId: '1', code: 'MOD001', name: 'DI模块', type: 'DI', channels: 16, description: '16通道数字量输入', status: 'online', createTime: '2024-01-01 09:15:00' },
                { id: '2', cabinetId: '1', masterId: '1', slaveId: '1', code: 'MOD002', name: 'DO模块', type: 'DO', channels: 16, description: '16通道数字量输出', status: 'online', createTime: '2024-01-01 09:20:00' },
                { id: '3', cabinetId: '1', masterId: '1', slaveId: '2', code: 'MOD003', name: 'AI模块', type: 'AI', channels: 8, description: '8通道模拟量输入', status: 'online', createTime: '2024-01-01 09:30:00' },
                { id: '4', cabinetId: '2', masterId: '3', slaveId: '3', code: 'MOD004', name: 'RTD模块', type: 'RTD', channels: 4, description: '4通道温度输入', status: 'offline', createTime: '2024-01-02 10:30:00' }
            ],
            signals: [
                {
                    id: '1',
                    cabinetId: '1',
                    masterId: '1',
                    slaveId: '1',
                    moduleId: '1',
                    code: 'SIG001',
                    name: '温度传感器1',
                    type: 'AI',
                    channel: 1,
                    unit: '℃',
                    rangeMin: -20,
                    rangeMax: 100,
                    currentValue: 25.5,
                    description: '车间温度监测',
                    status: 'online',
                    createTime: '2024-01-15 09:00:00'
                },
                {
                    id: '2',
                    cabinetId: '1',
                    masterId: '1',
                    slaveId: '1',
                    moduleId: '1',
                    code: 'SIG002',
                    name: '压力传感器1',
                    type: 'AI',
                    channel: 2,
                    unit: 'MPa',
                    rangeMin: 0,
                    rangeMax: 10,
                    currentValue: 3.2,
                    description: '管道压力监测',
                    status: 'online',
                    createTime: '2024-01-15 09:15:00'
                },
                {
                    id: '3',
                    cabinetId: '1',
                    masterId: '1',
                    slaveId: '2',
                    moduleId: '2',
                    code: 'SIG003',
                    name: '电机启停',
                    type: 'DO',
                    channel: 1,
                    unit: '',
                    rangeMin: 0,
                    rangeMax: 1,
                    currentValue: 1,
                    description: '主电机控制',
                    status: 'online',
                    createTime: '2024-01-15 09:30:00'
                },
                {
                    id: '4',
                    cabinetId: '2',
                    masterId: '3',
                    slaveId: '3',
                    moduleId: '4',
                    code: 'SIG004',
                    name: '温度传感器2',
                    type: 'RTD',
                    channel: 1,
                    unit: '℃',
                    rangeMin: 0,
                    rangeMax: 200,
                    currentValue: 85.0,
                    description: '设备温度监测',
                    status: 'online',
                    createTime: '2024-01-15 10:00:00'
                }
            ]
        };
        localStorage.setItem('deviceManagementData', JSON.stringify(sampleData));
    }
}

// 加载所有数据
function loadAllData() {
    const data = JSON.parse(localStorage.getItem('deviceManagementData')) || {};
    currentData.cabinets = data.cabinets || [];
    currentData.masters = data.masters || [];
    currentData.slaves = data.slaves || [];
    currentData.modules = data.modules || [];
    currentData.signals = data.signals || [];

    // 加载数据后更新所有视图
    refreshCabinetView();
    refreshMasterView();
    refreshSlaveView();
    refreshModuleView();
    refreshSignalView();

    // 更新过滤器选项
    updateFilterSelects();
}

// 保存所有数据
function saveAllData() {
    const data = {
        cabinets: currentData.cabinets,
        masters: currentData.masters,
        slaves: currentData.slaves,
        modules: currentData.modules,
        signals: currentData.signals
    };
    localStorage.setItem('deviceManagementData', JSON.stringify(data));
}

// 更新当前时间
function updateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent =
        now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
}

// 模块切换功能
function showModule(moduleId) {
    // 隐藏所有模块
    document.querySelectorAll('.module').forEach(module => {
        module.classList.remove('active');
    });

    // 移除所有菜单激活状态
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });

    // 显示目标模块
    document.getElementById(moduleId).classList.add('active');

    // 激活对应菜单项
    event.currentTarget.classList.add('active');

    // 更新过滤器选项
    updateFilterSelects();
}

// 初始化过滤器下拉框
function initFilterSelects() {
    // 机柜过滤器
    const cabinetFilters = ['master-cabinet-filter', 'slave-cabinet-filter', 'module-cabinet-filter', 'signal-cabinet-filter'];
    cabinetFilters.forEach(filterId => {
        const select = document.getElementById(filterId);
        if (select) select.innerHTML = '<option value="">全部机柜</option>';
    });

    // 主站过滤器
    const masterFilters = ['slave-master-filter', 'module-master-filter', 'signal-master-filter'];
    masterFilters.forEach(filterId => {
        const select = document.getElementById(filterId);
        if (select) select.innerHTML = '<option value="">全部主站</option>';
    });

    // 从站过滤器
    const slaveFilters = ['module-slave-filter', 'signal-slave-filter'];
    slaveFilters.forEach(filterId => {
        const select = document.getElementById(filterId);
        if (select) select.innerHTML = '<option value="">全部从站</option>';
    });
}

// 更新过滤器下拉框选项
function updateFilterSelects() {
    // 更新机柜过滤器
    const cabinetFilters = ['master-cabinet-filter', 'slave-cabinet-filter', 'module-cabinet-filter', 'signal-cabinet-filter'];
    cabinetFilters.forEach(filterId => {
        const select = document.getElementById(filterId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">全部机柜</option>';
            currentData.cabinets.forEach(cabinet => {
                const option = document.createElement('option');
                option.value = cabinet.id;
                option.textContent = `${cabinet.code} - ${cabinet.name}`;
                select.appendChild(option);
            });
            select.value = currentValue;
        }
    });

    // 更新主站过滤器
    updateMasterFilter();
    updateModuleMasterFilter();
    updateSignalMasterFilter();
}

// ==================== 通用功能函数 ====================

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 切换所有复选框
function toggleCheckboxes(source) {
    const checkboxes = document.querySelectorAll('.signal-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = source.checked;
    });

    // 更新全选复选框状态
    const selectAllCheckbox = document.getElementById('select-all-signals');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = source.checked;
    }
}

// ==================== 机柜管理 ====================

// 刷新机柜视图
function refreshCabinetView() {
    const searchTerm = document.getElementById('cabinet-search').value.toLowerCase();
    const filteredCabinets = searchTerm
        ? currentData.cabinets.filter(cabinet =>
            cabinet.code.toLowerCase().includes(searchTerm) ||
            cabinet.name.toLowerCase().includes(searchTerm) ||
            (cabinet.location && cabinet.location.toLowerCase().includes(searchTerm)))
        : currentData.cabinets;

    const tbody = document.getElementById('cabinet-table-body');
    tbody.innerHTML = '';

    filteredCabinets.forEach(cabinet => {
        // 统计下属设备数量
        const masterCount = currentData.masters.filter(master => master.cabinetId === cabinet.id).length;
        const slaveCount = currentData.slaves.filter(slave => slave.cabinetId === cabinet.id).length;
        const moduleCount = currentData.modules.filter(module => module.cabinetId === cabinet.id).length;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${cabinet.code}</strong></td>
            <td>${cabinet.name}</td>
            <td>${cabinet.location || '-'}</td>
            <td>
                <span class="status-indicator ${cabinet.status === 'online' ? 'status-online' : 'status-offline'}"></span>
                <span>${cabinet.status === 'online' ? '在线' : '离线'}</span>
            </td>
            <td><span class="badge badge-info">${masterCount}</span></td>
            <td><span class="badge badge-info">${slaveCount}</span></td>
            <td><span class="badge badge-info">${moduleCount}</span></td>
            <td>${cabinet.createTime}</td>
            <td class="action-buttons">
                <button class="btn btn-sm" style="background: #e6f7ff;" onclick="editCabinet('${cabinet.id}')">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="btn btn-sm" style="background: #fff2e8;" onclick="confirmDeleteItem('cabinet', '${cabinet.id}', '${cabinet.name}')">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('cabinet-count').textContent = `共 ${filteredCabinets.length} 个机柜`;
}

// 搜索机柜
function searchCabinets() {
    refreshCabinetView();
}

// 显示添加机柜模态框
function showAddCabinetModal() {
    document.getElementById('cabinetModalTitle').textContent = '新增机柜';
    document.getElementById('cabinet-id').value = '';
    document.getElementById('cabinet-code').value = '';
    document.getElementById('cabinet-name').value = '';
    document.getElementById('cabinet-location').value = '';
    document.getElementById('cabinet-description').value = '';

    const modal = new bootstrap.Modal(document.getElementById('cabinetModal'));
    modal.show();
}

// 编辑机柜
function editCabinet(id) {
    const cabinet = currentData.cabinets.find(c => c.id === id);
    if (!cabinet) return;

    document.getElementById('cabinetModalTitle').textContent = '编辑机柜';
    document.getElementById('cabinet-id').value = cabinet.id;
    document.getElementById('cabinet-code').value = cabinet.code;
    document.getElementById('cabinet-name').value = cabinet.name;
    document.getElementById('cabinet-location').value = cabinet.location || '';
    document.getElementById('cabinet-description').value = cabinet.description || '';

    const modal = new bootstrap.Modal(document.getElementById('cabinetModal'));
    modal.show();
}

// 保存机柜
function saveCabinet() {
    const id = document.getElementById('cabinet-id').value;
    const code = document.getElementById('cabinet-code').value.trim();
    const name = document.getElementById('cabinet-name').value.trim();
    const location = document.getElementById('cabinet-location').value.trim();
    const description = document.getElementById('cabinet-description').value.trim();

    // 验证
    if (!code || !name) {
        alert('机柜编号和名称不能为空！');
        return;
    }

    // 检查编号是否重复（编辑时排除自己）
    const isDuplicate = currentData.cabinets.some(cabinet =>
        cabinet.code === code && cabinet.id !== id);

    if (isDuplicate) {
        alert('机柜编号已存在！');
        return;
    }

    if (id) {
        // 编辑现有机柜
        const index = currentData.cabinets.findIndex(c => c.id === id);
        if (index !== -1) {
            currentData.cabinets[index] = {
                ...currentData.cabinets[index],
                code,
                name,
                location,
                description
            };
        }
    } else {
        // 添加新机柜
        const newCabinet = {
            id: generateId(),
            code,
            name,
            location,
            description,
            status: 'online',
            createTime: new Date().toLocaleString()
        };
        currentData.cabinets.push(newCabinet);
    }

    saveAllData();
    refreshCabinetView();
    updateFilterSelects();

    // 关闭模态框
    const modal = bootstrap.Modal.getInstance(document.getElementById('cabinetModal'));
    modal.hide();
}

// ==================== 主站管理 ====================

// 更新主站过滤器（用于从站管理）
function updateMasterFilter() {
    const cabinetId = document.getElementById('slave-cabinet-filter').value;
    const masterFilter = document.getElementById('slave-master-filter');

    // 保存当前选中的值
    const currentValue = masterFilter.value;
    masterFilter.innerHTML = '<option value="">全部主站</option>';

    // 过滤主站
    const filteredMasters = cabinetId
        ? currentData.masters.filter(master => master.cabinetId === cabinetId)
        : currentData.masters;

    filteredMasters.forEach(master => {
        const cabinet = currentData.cabinets.find(c => c.id === master.cabinetId);
        const option = document.createElement('option');
        option.value = master.id;
        option.textContent = `${master.code} - ${master.name}`;
        if (cabinet) {
            option.dataset.cabinetId = cabinet.id;
        }
        masterFilter.appendChild(option);
    });

    // 恢复之前选中的值
    masterFilter.value = currentValue;
}

// 刷新主站视图
function refreshMasterView() {
    const searchTerm = document.getElementById('master-search').value.toLowerCase();
    const cabinetId = document.getElementById('master-cabinet-filter').value;

    let filteredMasters = currentData.masters;

    // 应用搜索条件
    if (searchTerm) {
        filteredMasters = filteredMasters.filter(master =>
            master.code.toLowerCase().includes(searchTerm) ||
            master.name.toLowerCase().includes(searchTerm) ||
            master.ip.toLowerCase().includes(searchTerm));
    }

    // 应用机柜过滤条件
    if (cabinetId) {
        filteredMasters = filteredMasters.filter(master => master.cabinetId === cabinetId);
    }

    const tbody = document.getElementById('master-table-body');
    tbody.innerHTML = '';

    filteredMasters.forEach(master => {
        // 查找所属机柜
        const cabinet = currentData.cabinets.find(c => c.id === master.cabinetId);
        const cabinetName = cabinet ? `${cabinet.code} - ${cabinet.name}` : '未知机柜';

        // 统计下属设备数量
        const slaveCount = currentData.slaves.filter(slave => slave.masterId === master.id).length;
        const moduleCount = currentData.modules.filter(module => module.masterId === master.id).length;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${master.code}</strong></td>
            <td>${master.name}</td>
            <td>${cabinetName}</td>
            <td>${master.ip}</td>
            <td>${master.port}</td>
            <td>
                <span class="status-indicator ${master.status === 'online' ? 'status-online' : 'status-offline'}"></span>
                <span>${master.status === 'online' ? '在线' : '离线'}</span>
            </td>
            <td><span class="badge badge-info">${slaveCount}</span></td>
            <td><span class="badge badge-info">${moduleCount}</span></td>
            <td>${master.createTime}</td>
            <td class="action-buttons">
                <button class="btn btn-sm" style="background: #e6f7ff;" onclick="editMaster('${master.id}')">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="btn btn-sm" style="background: #fff2e8;" onclick="confirmDeleteItem('master', '${master.id}', '${master.name}')">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('master-count').textContent = `共 ${filteredMasters.length} 个主站`;
}

// 搜索主站
function searchMasters() {
    refreshMasterView();
}

// 重置主站过滤器
function resetMasterFilter() {
    document.getElementById('master-search').value = '';
    document.getElementById('master-cabinet-filter').value = '';
    refreshMasterView();
}

// 显示添加主站模态框
function showAddMasterModal() {
    document.getElementById('masterModalTitle').textContent = '新增主站';
    document.getElementById('master-id').value = '';

    // 清空表单
    const form = document.getElementById('masterForm');
    form.reset();

    // 更新机柜下拉框
    const cabinetSelect = document.getElementById('master-cabinet');
    cabinetSelect.innerHTML = '<option value="">请选择机柜</option>';
    currentData.cabinets.forEach(cabinet => {
        const option = document.createElement('option');
        option.value = cabinet.id;
        option.textContent = `${cabinet.code} - ${cabinet.name}`;
        cabinetSelect.appendChild(option);
    });

    const modal = new bootstrap.Modal(document.getElementById('masterModal'));
    modal.show();
}

// 编辑主站
function editMaster(id) {
    const master = currentData.masters.find(m => m.id === id);
    if (!master) return;

    document.getElementById('masterModalTitle').textContent = '编辑主站';
    document.getElementById('master-id').value = master.id;
    document.getElementById('master-code').value = master.code;
    document.getElementById('master-name').value = master.name;
    document.getElementById('master-ip').value = master.ip;
    document.getElementById('master-port').value = master.port;
    document.getElementById('master-description').value = master.description || '';

    // 更新机柜下拉框
    const cabinetSelect = document.getElementById('master-cabinet');
    cabinetSelect.innerHTML = '<option value="">请选择机柜</option>';
    currentData.cabinets.forEach(cabinet => {
        const option = document.createElement('option');
        option.value = cabinet.id;
        option.textContent = `${cabinet.code} - ${cabinet.name}`;
        option.selected = cabinet.id === master.cabinetId;
        cabinetSelect.appendChild(option);
    });

    const modal = new bootstrap.Modal(document.getElementById('masterModal'));
    modal.show();
}

// 保存主站
function saveMaster() {
    const id = document.getElementById('master-id').value;
    const cabinetId = document.getElementById('master-cabinet').value;
    const code = document.getElementById('master-code').value.trim();
    const name = document.getElementById('master-name').value.trim();
    const ip = document.getElementById('master-ip').value.trim();
    const port = document.getElementById('master-port').value.trim();
    const description = document.getElementById('master-description').value.trim();

    // 验证
    if (!cabinetId || !code || !name || !ip || !port) {
        alert('所有带*的字段都不能为空！');
        return;
    }

    // 验证IP地址格式
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
        alert('IP地址格式不正确！');
        return;
    }

    // 检查编号是否重复（编辑时排除自己）
    const isDuplicate = currentData.masters.some(master =>
        master.code === code && master.id !== id);

    if (isDuplicate) {
        alert('主站编号已存在！');
        return;
    }

    if (id) {
        // 编辑现有主站
        const index = currentData.masters.findIndex(m => m.id === id);
        if (index !== -1) {
            currentData.masters[index] = {
                ...currentData.masters[index],
                cabinetId,
                code,
                name,
                ip,
                port: parseInt(port),
                description
            };
        }
    } else {
        // 添加新主站
        const newMaster = {
            id: generateId(),
            cabinetId,
            code,
            name,
            ip,
            port: parseInt(port),
            description,
            status: 'online',
            createTime: new Date().toLocaleString()
        };
        currentData.masters.push(newMaster);
    }

    saveAllData();
    refreshMasterView();
    updateFilterSelects();

    // 关闭模态框
    const modal = bootstrap.Modal.getInstance(document.getElementById('masterModal'));
    modal.hide();
}

// ==================== 从站管理 ====================

// 更新主站选择下拉框（用于从站管理）
function updateMasterSelect() {
    const cabinetId = document.getElementById('slave-cabinet').value;
    const masterSelect = document.getElementById('slave-master');

    masterSelect.innerHTML = '<option value="">请选择主站</option>';

    if (cabinetId) {
        const filteredMasters = currentData.masters.filter(master => master.cabinetId === cabinetId);
        filteredMasters.forEach(master => {
            const option = document.createElement('option');
            option.value = master.id;
            option.textContent = `${master.code} - ${master.name}`;
            masterSelect.appendChild(option);
        });
    }
}

// 刷新从站视图
function refreshSlaveView() {
    const searchTerm = document.getElementById('slave-search').value.toLowerCase();
    const cabinetId = document.getElementById('slave-cabinet-filter').value;
    const masterId = document.getElementById('slave-master-filter').value;

    let filteredSlaves = currentData.slaves;

    // 应用搜索条件
    if (searchTerm) {
        filteredSlaves = filteredSlaves.filter(slave =>
            slave.code.toLowerCase().includes(searchTerm) ||
            slave.name.toLowerCase().includes(searchTerm));
    }

    // 应用机柜过滤条件
    if (cabinetId) {
        filteredSlaves = filteredSlaves.filter(slave => slave.cabinetId === cabinetId);
    }

    // 应用主站过滤条件
    if (masterId) {
        filteredSlaves = filteredSlaves.filter(slave => slave.masterId === masterId);
    }

    const tbody = document.getElementById('slave-table-body');
    tbody.innerHTML = '';

    filteredSlaves.forEach(slave => {
        // 查找所属机柜和主站
        const cabinet = currentData.cabinets.find(c => c.id === slave.cabinetId);
        const master = currentData.masters.find(m => m.id === slave.masterId);

        const cabinetName = cabinet ? `${cabinet.code} - ${cabinet.name}` : '未知机柜';
        const masterName = master ? `${master.code} - ${master.name}` : '未知主站';

        // 统计下属设备数量
        const moduleCount = currentData.modules.filter(module => module.slaveId === slave.id).length;

        // 协议显示名称
        const protocolNames = {
            'MODBUS_RTU': 'MODBUS RTU',
            'MODBUS_TCP': 'MODBUS TCP',
            'PROFIBUS': 'PROFIBUS',
            'PROFINET': 'PROFINET'
        };

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${slave.code}</strong></td>
            <td>${slave.name}</td>
            <td>${cabinetName}</td>
            <td>${masterName}</td>
            <td>${slave.address}</td>
            <td>${protocolNames[slave.protocol] || slave.protocol}</td>
            <td>
                <span class="status-indicator ${slave.status === 'online' ? 'status-online' : 'status-offline'}"></span>
                <span>${slave.status === 'online' ? '在线' : '离线'}</span>
            </td>
            <td><span class="badge badge-info">${moduleCount}</span></td>
            <td>${slave.createTime}</td>
            <td class="action-buttons">
                <button class="btn btn-sm" style="background: #e6f7ff;" onclick="editSlave('${slave.id}')">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="btn btn-sm" style="background: #fff2e8;" onclick="confirmDeleteItem('slave', '${slave.id}', '${slave.name}')">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('slave-count').textContent = `共 ${filteredSlaves.length} 个从站`;
}

// 搜索从站
function searchSlaves() {
    refreshSlaveView();
}

// 重置从站过滤器
function resetSlaveFilter() {
    document.getElementById('slave-search').value = '';
    document.getElementById('slave-cabinet-filter').value = '';
    document.getElementById('slave-master-filter').value = '';
    refreshSlaveView();
}

// 显示添加从站模态框
function showAddSlaveModal() {
    document.getElementById('slaveModalTitle').textContent = '新增从站';
    document.getElementById('slave-id').value = '';

    // 清空表单
    const form = document.getElementById('slaveForm');
    form.reset();

    // 更新机柜下拉框
    const cabinetSelect = document.getElementById('slave-cabinet');
    cabinetSelect.innerHTML = '<option value="">请选择机柜</option>';
    currentData.cabinets.forEach(cabinet => {
        const option = document.createElement('option');
        option.value = cabinet.id;
        option.textContent = `${cabinet.code} - ${cabinet.name}`;
        cabinetSelect.appendChild(option);
    });

    // 清空主站下拉框
    document.getElementById('slave-master').innerHTML = '<option value="">请选择主站</option>';

    const modal = new bootstrap.Modal(document.getElementById('slaveModal'));
    modal.show();
}

// 编辑从站
function editSlave(id) {
    const slave = currentData.slaves.find(s => s.id === id);
    if (!slave) return;

    document.getElementById('slaveModalTitle').textContent = '编辑从站';
    document.getElementById('slave-id').value = slave.id;
    document.getElementById('slave-code').value = slave.code;
    document.getElementById('slave-name').value = slave.name;
    document.getElementById('slave-address').value = slave.address;
    document.getElementById('slave-protocol').value = slave.protocol;
    document.getElementById('slave-description').value = slave.description || '';

    // 更新机柜下拉框
    const cabinetSelect = document.getElementById('slave-cabinet');
    cabinetSelect.innerHTML = '<option value="">请选择机柜</option>';
    currentData.cabinets.forEach(cabinet => {
        const option = document.createElement('option');
        option.value = cabinet.id;
        option.textContent = `${cabinet.code} - ${cabinet.name}`;
        option.selected = cabinet.id === slave.cabinetId;
        cabinetSelect.appendChild(option);
    });

    // 更新主站下拉框
    updateMasterSelect();

    // 设置选中的主站
    setTimeout(() => {
        document.getElementById('slave-master').value = slave.masterId;
    }, 100);

    const modal = new bootstrap.Modal(document.getElementById('slaveModal'));
    modal.show();
}

// 保存从站
function saveSlave() {
    const id = document.getElementById('slave-id').value;
    const cabinetId = document.getElementById('slave-cabinet').value;
    const masterId = document.getElementById('slave-master').value;
    const code = document.getElementById('slave-code').value.trim();
    const name = document.getElementById('slave-name').value.trim();
    const address = document.getElementById('slave-address').value.trim();
    const protocol = document.getElementById('slave-protocol').value;
    const description = document.getElementById('slave-description').value.trim();

    // 验证
    if (!cabinetId || !masterId || !code || !name || !address || !protocol) {
        alert('所有带*的字段都不能为空！');
        return;
    }

    // 检查编号是否重复（编辑时排除自己）
    const isDuplicate = currentData.slaves.some(slave =>
        slave.code === code && slave.id !== id);

    if (isDuplicate) {
        alert('从站编号已存在！');
        return;
    }

    if (id) {
        // 编辑现有从站
        const index = currentData.slaves.findIndex(s => s.id === id);
        if (index !== -1) {
            currentData.slaves[index] = {
                ...currentData.slaves[index],
                cabinetId,
                masterId,
                code,
                name,
                address: parseInt(address),
                protocol,
                description
            };
        }
    } else {
        // 添加新从站
        const newSlave = {
            id: generateId(),
            cabinetId,
            masterId,
            code,
            name,
            address: parseInt(address),
            protocol,
            description,
            status: 'online',
            createTime: new Date().toLocaleString()
        };
        currentData.slaves.push(newSlave);
    }

    saveAllData();
    refreshSlaveView();
    updateFilterSelects();

    // 关闭模态框
    const modal = bootstrap.Modal.getInstance(document.getElementById('slaveModal'));
    modal.hide();
}

// ==================== 模块管理 ====================

// 更新模块管理中的主站过滤器
function updateModuleMasterFilter() {
    const cabinetId = document.getElementById('module-cabinet-filter').value;
    const masterFilter = document.getElementById('module-master-filter');

    // 保存当前选中的值
    const currentValue = masterFilter.value;
    masterFilter.innerHTML = '<option value="">全部主站</option>';

    // 过滤主站
    const filteredMasters = cabinetId
        ? currentData.masters.filter(master => master.cabinetId === cabinetId)
        : currentData.masters;

    filteredMasters.forEach(master => {
        const cabinet = currentData.cabinets.find(c => c.id === master.cabinetId);
        const option = document.createElement('option');
        option.value = master.id;
        option.textContent = `${master.code} - ${master.name}`;
        if (cabinet) {
            option.dataset.cabinetId = cabinet.id;
        }
        masterFilter.appendChild(option);
    });

    // 恢复之前选中的值
    masterFilter.value = currentValue;

    // 更新从站过滤器
    updateModuleSlaveFilter();
}

// 更新模块管理中的从站过滤器
function updateModuleSlaveFilter() {
    const masterId = document.getElementById('module-master-filter').value;
    const slaveFilter = document.getElementById('module-slave-filter');

    // 保存当前选中的值
    const currentValue = slaveFilter.value;
    slaveFilter.innerHTML = '<option value="">全部从站</option>';

    // 过滤从站
    const filteredSlaves = masterId
        ? currentData.slaves.filter(slave => slave.masterId === masterId)
        : currentData.slaves;

    filteredSlaves.forEach(slave => {
        const master = currentData.masters.find(m => m.id === slave.masterId);
        const cabinet = currentData.cabinets.find(c => c.id === slave.cabinetId);
        const option = document.createElement('option');
        option.value = slave.id;
        option.textContent = `${slave.code} - ${slave.name}`;
        if (master) {
            option.dataset.masterId = master.id;
        }
        if (cabinet) {
            option.dataset.cabinetId = cabinet.id;
        }
        slaveFilter.appendChild(option);
    });

    // 恢复之前选中的值
    slaveFilter.value = currentValue;
}

// 刷新模块视图
function refreshModuleView() {
    const searchTerm = document.getElementById('module-search').value.toLowerCase();
    const cabinetId = document.getElementById('module-cabinet-filter').value;
    const masterId = document.getElementById('module-master-filter').value;
    const slaveId = document.getElementById('module-slave-filter').value;

    let filteredModules = currentData.modules;

    // 应用搜索条件
    if (searchTerm) {
        filteredModules = filteredModules.filter(module =>
            module.code.toLowerCase().includes(searchTerm) ||
            module.name.toLowerCase().includes(searchTerm) ||
            module.type.toLowerCase().includes(searchTerm));
    }

    // 应用机柜过滤条件
    if (cabinetId) {
        filteredModules = filteredModules.filter(module => module.cabinetId === cabinetId);
    }

    // 应用主站过滤条件
    if (masterId) {
        filteredModules = filteredModules.filter(module => module.masterId === masterId);
    }

    // 应用从站过滤条件
    if (slaveId) {
        filteredModules = filteredModules.filter(module => module.slaveId === slaveId);
    }

    const tbody = document.getElementById('module-table-body');
    tbody.innerHTML = '';

    filteredModules.forEach(module => {
        // 查找所属机柜、主站和从站
        const cabinet = currentData.cabinets.find(c => c.id === module.cabinetId);
        const master = currentData.masters.find(m => m.id === module.masterId);
        const slave = currentData.slaves.find(s => s.id === module.slaveId);

        const cabinetName = cabinet ? `${cabinet.code} - ${cabinet.name}` : '未知机柜';
        const masterName = master ? `${master.code} - ${master.name}` : '未知主站';
        const slaveName = slave ? `${slave.code} - ${slave.name}` : '未知从站';

        // 类型显示名称
        const typeNames = {
            'DI': '数字量输入(DI)',
            'DO': '数字量输出(DO)',
            'AI': '模拟量输入(AI)',
            'AO': '模拟量输出(AO)',
            'RTD': '温度(RTD)',
            'TC': '热电偶(TC)',
            'COMM': '通信模块'
        };

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${module.code}</strong></td>
            <td>${module.name}</td>
            <td>${cabinetName}</td>
            <td>${masterName}</td>
            <td>${slaveName}</td>
            <td>${typeNames[module.type] || module.type}</td>
            <td>${module.channels}</td>
            <td>
                <span class="status-indicator ${module.status === 'online' ? 'status-online' : 'status-offline'}"></span>
                <span>${module.status === 'online' ? '在线' : '离线'}</span>
            </td>
            <td>${module.createTime}</td>
            <td class="action-buttons">
                <button class="btn btn-sm" style="background: #e6f7ff;" onclick="editModule('${module.id}')">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="btn btn-sm" style="background: #fff2e8;" onclick="confirmDeleteItem('module', '${module.id}', '${module.name}')">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('module-count').textContent = `共 ${filteredModules.length} 个模块`;
}

// 搜索模块
function searchModules() {
    refreshModuleView();
}

// 重置模块过滤器
function resetModuleFilter() {
    document.getElementById('module-search').value = '';
    document.getElementById('module-cabinet-filter').value = '';
    document.getElementById('module-master-filter').value = '';
    document.getElementById('module-slave-filter').value = '';
    refreshModuleView();
}

// 显示添加模块模态框
function showAddModuleModal() {
    document.getElementById('moduleModalTitle').textContent = '新增模块';
    document.getElementById('module-id').value = '';

    // 清空表单
    const form = document.getElementById('moduleForm');
    form.reset();

    // 更新机柜下拉框
    const cabinetSelect = document.getElementById('module-cabinet');
    cabinetSelect.innerHTML = '<option value="">请选择机柜</option>';
    currentData.cabinets.forEach(cabinet => {
        const option = document.createElement('option');
        option.value = cabinet.id;
        option.textContent = `${cabinet.code} - ${cabinet.name}`;
        cabinetSelect.appendChild(option);
    });

    // 清空主站和从站下拉框
    document.getElementById('module-master').innerHTML = '<option value="">请选择主站</option>';
    document.getElementById('module-slave').innerHTML = '<option value="">请选择从站</option>';

    const modal = new bootstrap.Modal(document.getElementById('moduleModal'));
    modal.show();
}

// 更新模块管理中的主站选择下拉框
function updateModuleMasterSelect() {
    const cabinetId = document.getElementById('module-cabinet').value;
    const masterSelect = document.getElementById('module-master');

    masterSelect.innerHTML = '<option value="">请选择主站</option>';

    if (cabinetId) {
        const filteredMasters = currentData.masters.filter(master => master.cabinetId === cabinetId);
        filteredMasters.forEach(master => {
            const option = document.createElement('option');
            option.value = master.id;
            option.textContent = `${master.code} - ${master.name}`;
            masterSelect.appendChild(option);
        });
    }

    // 更新从站选择下拉框
    updateModuleSlaveSelect();
}

// 更新模块管理中的从站选择下拉框
function updateModuleSlaveSelect() {
    const masterId = document.getElementById('module-master').value;
    const slaveSelect = document.getElementById('module-slave');

    slaveSelect.innerHTML = '<option value="">请选择从站</option>';

    if (masterId) {
        const filteredSlaves = currentData.slaves.filter(slave => slave.masterId === masterId);
        filteredSlaves.forEach(slave => {
            const option = document.createElement('option');
            option.value = slave.id;
            option.textContent = `${slave.code} - ${slave.name}`;
            slaveSelect.appendChild(option);
        });
    }
}

// 编辑模块
function editModule(id) {
    const module = currentData.modules.find(m => m.id === id);
    if (!module) return;

    document.getElementById('moduleModalTitle').textContent = '编辑模块';
    document.getElementById('module-id').value = module.id;
    document.getElementById('module-code').value = module.code;
    document.getElementById('module-name').value = module.name;
    document.getElementById('module-type').value = module.type;
    document.getElementById('module-channels').value = module.channels;
    document.getElementById('module-description').value = module.description || '';

    // 更新机柜下拉框
    const cabinetSelect = document.getElementById('module-cabinet');
    cabinetSelect.innerHTML = '<option value="">请选择机柜</option>';
    currentData.cabinets.forEach(cabinet => {
        const option = document.createElement('option');
        option.value = cabinet.id;
        option.textContent = `${cabinet.code} - ${cabinet.name}`;
        option.selected = cabinet.id === module.cabinetId;
        cabinetSelect.appendChild(option);
    });

    // 更新主站下拉框
    updateModuleMasterSelect();

    // 设置选中的主站
    setTimeout(() => {
        document.getElementById('module-master').value = module.masterId;

        // 更新从站下拉框
        updateModuleSlaveSelect();

        // 设置选中的从站
        setTimeout(() => {
            document.getElementById('module-slave').value = module.slaveId;
        }, 100);
    }, 100);

    const modal = new bootstrap.Modal(document.getElementById('moduleModal'));
    modal.show();
}

// 保存模块
function saveModule() {
    const id = document.getElementById('module-id').value;
    const cabinetId = document.getElementById('module-cabinet').value;
    const masterId = document.getElementById('module-master').value;
    const slaveId = document.getElementById('module-slave').value;
    const code = document.getElementById('module-code').value.trim();
    const name = document.getElementById('module-name').value.trim();
    const type = document.getElementById('module-type').value;
    const channels = document.getElementById('module-channels').value.trim();
    const description = document.getElementById('module-description').value.trim();

    // 验证
    if (!cabinetId || !masterId || !slaveId || !code || !name || !type || !channels) {
        alert('所有带*的字段都不能为空！');
        return;
    }

    // 检查编号是否重复（编辑时排除自己）
    const isDuplicate = currentData.modules.some(module =>
        module.code === code && module.id !== id);

    if (isDuplicate) {
        alert('模块编号已存在！');
        return;
    }

    if (id) {
        // 编辑现有模块
        const index = currentData.modules.findIndex(m => m.id === id);
        if (index !== -1) {
            currentData.modules[index] = {
                ...currentData.modules[index],
                cabinetId,
                masterId,
                slaveId,
                code,
                name,
                type,
                channels: parseInt(channels),
                description
            };
        }
    } else {
        // 添加新模块
        const newModule = {
            id: generateId(),
            cabinetId,
            masterId,
            slaveId,
            code,
            name,
            type,
            channels: parseInt(channels),
            description,
            status: 'online',
            createTime: new Date().toLocaleString()
        };
        currentData.modules.push(newModule);
    }

    saveAllData();
    refreshModuleView();
    updateFilterSelects();

    // 关闭模态框
    const modal = bootstrap.Modal.getInstance(document.getElementById('moduleModal'));
    modal.hide();
}

// ==================== 信号管理 ====================

// 更新信号主站过滤器
function updateSignalMasterFilter() {
    const cabinetId = document.getElementById('signal-cabinet-filter').value;
    const masterFilter = document.getElementById('signal-master-filter');

    const currentValue = masterFilter.value;
    masterFilter.innerHTML = '<option value="">全部主站</option>';

    const filteredMasters = cabinetId
        ? currentData.masters.filter(master => master.cabinetId === cabinetId)
        : currentData.masters;

    filteredMasters.forEach(master => {
        const cabinet = currentData.cabinets.find(c => c.id === master.cabinetId);
        const option = document.createElement('option');
        option.value = master.id;
        option.textContent = `${master.code} - ${master.name}`;
        if (cabinet) {
            option.dataset.cabinetId = cabinet.id;
        }
        masterFilter.appendChild(option);
    });

    masterFilter.value = currentValue;
    updateSignalSlaveFilter();
}

// 更新信号从站过滤器
function updateSignalSlaveFilter() {
    const masterId = document.getElementById('signal-master-filter').value;
    const slaveFilter = document.getElementById('signal-slave-filter');

    const currentValue = slaveFilter.value;
    slaveFilter.innerHTML = '<option value="">全部从站</option>';

    let filteredSlaves = currentData.slaves;
    if (masterId) {
        filteredSlaves = filteredSlaves.filter(slave => slave.masterId === masterId);
    }

    filteredSlaves.forEach(slave => {
        const master = currentData.masters.find(m => m.id === slave.masterId);
        const option = document.createElement('option');
        option.value = slave.id;
        option.textContent = `${slave.code} - ${slave.name}`;
        if (master) {
            option.dataset.masterId = master.id;
        }
        slaveFilter.appendChild(option);
    });

    slaveFilter.value = currentValue;
    updateSignalModuleFilter();
}

// 更新信号模块过滤器
function updateSignalModuleFilter() {
    const slaveId = document.getElementById('signal-slave-filter').value;
    // 注意：这个函数暂时不需要，因为信号管理的模块过滤是在添加/编辑时使用的
}

// 刷新信号视图
function refreshSignalView() {
    const searchTerm = document.getElementById('signal-search').value.toLowerCase();
    const cabinetId = document.getElementById('signal-cabinet-filter').value;
    const masterId = document.getElementById('signal-master-filter').value;
    const slaveId = document.getElementById('signal-slave-filter').value;

    let filteredSignals = currentData.signals;

    // 应用搜索条件
    if (searchTerm) {
        filteredSignals = filteredSignals.filter(signal =>
            signal.code.toLowerCase().includes(searchTerm) ||
            signal.name.toLowerCase().includes(searchTerm));
    }

    // 应用过滤条件
    if (cabinetId) {
        filteredSignals = filteredSignals.filter(signal => signal.cabinetId === cabinetId);
    }
    if (masterId) {
        filteredSignals = filteredSignals.filter(signal => signal.masterId === masterId);
    }
    if (slaveId) {
        filteredSignals = filteredSignals.filter(signal => signal.slaveId === slaveId);
    }

    const tbody = document.getElementById('signal-table-body');
    tbody.innerHTML = '';

    filteredSignals.forEach((signal, index) => {
        // 查找所属路径
        const cabinet = currentData.cabinets.find(c => c.id === signal.cabinetId);
        const master = currentData.masters.find(m => m.id === signal.masterId);
        const slave = currentData.slaves.find(s => s.id === signal.slaveId);
        const module = currentData.modules.find(m => m.id === signal.moduleId);

        const cabinetName = cabinet ? cabinet.code : '未知机柜';
        const masterName = master ? master.code : '未知主站';
        const slaveName = slave ? slave.code : '未知从站';
        const moduleName = module ? module.code : '未知模块';

        const path = `${cabinetName} > ${masterName} > ${slaveName} > ${moduleName}`;

        // 类型显示名称
        const typeNames = {
            'AI': '模拟量输入(AI)',
            'AO': '模拟量输出(AO)',
            'DI': '数字量输入(DI)',
            'DO': '数字量输出(DO)',
            'RTD': '温度(RTD)',
            'TC': '热电偶(TC)',
            'PO': '脉冲输出(PO)'
        };

        // 量程范围显示
        const range = signal.rangeMin !== undefined && signal.rangeMax !== undefined
            ? `${signal.rangeMin} ~ ${signal.rangeMax}`
            : '-';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="checkbox" class="signal-checkbox" value="${signal.id}" data-signal-name="${signal.name}">
            </td>
            <td><strong>${signal.code}</strong></td>
            <td>${signal.name}</td>
            <td>${path}</td>
            <td>${typeNames[signal.type] || signal.type}</td>
            <td>${signal.channel}</td>
            <td>${signal.unit || '-'}</td>
            <td>${range}</td>
            <td>
                <span class="${signal.currentValue !== undefined ? 'text-primary fw-bold' : ''}">
                    ${signal.currentValue !== undefined ? signal.currentValue : '-'}
                </span>
            </td>
            <td>
                <span class="status-indicator ${signal.status === 'online' ? 'status-online' : 'status-offline'}"></span>
                <span>${signal.status === 'online' ? '在线' : '离线'}</span>
            </td>
            <td>${signal.createTime}</td>
            <td class="action-buttons">
                <button class="btn btn-sm" style="background: #e6f7ff;" onclick="editSignal('${signal.id}')">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="btn btn-sm" style="background: #fff2e8;" onclick="confirmDeleteItem('signal', '${signal.id}', '${signal.name}')">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('signal-count').textContent = `共 ${filteredSignals.length} 个信号`;
}

// 搜索信号
function searchSignals() {
    refreshSignalView();
}

// 重置信号过滤器
function resetSignalFilter() {
    document.getElementById('signal-search').value = '';
    document.getElementById('signal-cabinet-filter').value = '';
    document.getElementById('signal-master-filter').value = '';
    document.getElementById('signal-slave-filter').value = '';
    refreshSignalView();
}

// 显示添加信号模态框
function showAddSignalModal() {
    document.getElementById('signalModalTitle').textContent = '新增信号';
    document.getElementById('signal-id').value = '';

    // 清空表单
    const form = document.getElementById('signalForm');
    form.reset();

    // 更新机柜下拉框
    const cabinetSelect = document.getElementById('signal-cabinet');
    cabinetSelect.innerHTML = '<option value="">请选择机柜</option>';
    currentData.cabinets.forEach(cabinet => {
        const option = document.createElement('option');
        option.value = cabinet.id;
        option.textContent = `${cabinet.code} - ${cabinet.name}`;
        cabinetSelect.appendChild(option);
    });

    // 清空其他下拉框
    document.getElementById('signal-master').innerHTML = '<option value="">请选择主站</option>';
    document.getElementById('signal-slave').innerHTML = '<option value="">请选择从站</option>';
    document.getElementById('signal-module').innerHTML = '<option value="">请选择模块</option>';

    const modal = new bootstrap.Modal(document.getElementById('signalModal'));
    modal.show();
}

// 更新信号管理中的主站选择下拉框
function updateSignalMasterSelect() {
    const cabinetId = document.getElementById('signal-cabinet').value;
    const masterSelect = document.getElementById('signal-master');

    masterSelect.innerHTML = '<option value="">请选择主站</option>';

    if (cabinetId) {
        const filteredMasters = currentData.masters.filter(master => master.cabinetId === cabinetId);
        filteredMasters.forEach(master => {
            const option = document.createElement('option');
            option.value = master.id;
            option.textContent = `${master.code} - ${master.name}`;
            masterSelect.appendChild(option);
        });
    }

    // 更新从站选择下拉框
    updateSignalSlaveSelect();
}

// 更新信号管理中的从站选择下拉框
function updateSignalSlaveSelect() {
    const masterId = document.getElementById('signal-master').value;
    const slaveSelect = document.getElementById('signal-slave');

    slaveSelect.innerHTML = '<option value="">请选择从站</option>';

    if (masterId) {
        const filteredSlaves = currentData.slaves.filter(slave => slave.masterId === masterId);
        filteredSlaves.forEach(slave => {
            const option = document.createElement('option');
            option.value = slave.id;
            option.textContent = `${slave.code} - ${slave.name}`;
            slaveSelect.appendChild(option);
        });
    }

    // 更新模块选择下拉框
    updateSignalModuleSelect();
}

// 更新信号管理中的模块选择下拉框
function updateSignalModuleSelect() {
    const slaveId = document.getElementById('signal-slave').value;
    const moduleSelect = document.getElementById('signal-module');

    moduleSelect.innerHTML = '<option value="">请选择模块</option>';

    if (slaveId) {
        const filteredModules = currentData.modules.filter(module => module.slaveId === slaveId);
        filteredModules.forEach(module => {
            const option = document.createElement('option');
            option.value = module.id;
            option.textContent = `${module.code} - ${module.name}`;
            option.dataset.slaveId = module.slaveId;
            moduleSelect.appendChild(option);
        });
    }
}

// 编辑信号
function editSignal(id) {
    const signal = currentData.signals.find(s => s.id === id);
    if (!signal) return;

    document.getElementById('signalModalTitle').textContent = '编辑信号';
    document.getElementById('signal-id').value = signal.id;
    document.getElementById('signal-code').value = signal.code;
    document.getElementById('signal-name').value = signal.name;
    document.getElementById('signal-type').value = signal.type;
    document.getElementById('signal-channel').value = signal.channel;
    document.getElementById('signal-unit').value = signal.unit || '';
    document.getElementById('signal-range-min').value = signal.rangeMin || '';
    document.getElementById('signal-range-max').value = signal.rangeMax || '';
    document.getElementById('signal-description').value = signal.description || '';

    // 更新机柜下拉框
    const cabinetSelect = document.getElementById('signal-cabinet');
    cabinetSelect.innerHTML = '<option value="">请选择机柜</option>';
    currentData.cabinets.forEach(cabinet => {
        const option = document.createElement('option');
        option.value = cabinet.id;
        option.textContent = `${cabinet.code} - ${cabinet.name}`;
        option.selected = cabinet.id === signal.cabinetId;
        cabinetSelect.appendChild(option);
    });

    // 更新主站下拉框
    updateSignalMasterSelect();

    // 设置选中的主站
    setTimeout(() => {
        document.getElementById('signal-master').value = signal.masterId;

        // 更新从站下拉框
        updateSignalSlaveSelect();

        // 设置选中的从站
        setTimeout(() => {
            document.getElementById('signal-slave').value = signal.slaveId;

            // 更新模块下拉框
            updateSignalModuleSelect();

            // 设置选中的模块
            setTimeout(() => {
                document.getElementById('signal-module').value = signal.moduleId;
            }, 100);
        }, 100);
    }, 100);

    const modal = new bootstrap.Modal(document.getElementById('signalModal'));
    modal.show();
}

// 保存信号
function saveSignal() {
    const id = document.getElementById('signal-id').value;
    const cabinetId = document.getElementById('signal-cabinet').value;
    const masterId = document.getElementById('signal-master').value;
    const slaveId = document.getElementById('signal-slave').value;
    const moduleId = document.getElementById('signal-module').value;
    const code = document.getElementById('signal-code').value.trim();
    const name = document.getElementById('signal-name').value.trim();
    const type = document.getElementById('signal-type').value;
    const channel = document.getElementById('signal-channel').value.trim();
    const unit = document.getElementById('signal-unit').value.trim();
    const rangeMin = document.getElementById('signal-range-min').value.trim();
    const rangeMax = document.getElementById('signal-range-max').value.trim();
    const description = document.getElementById('signal-description').value.trim();

    // 验证
    if (!cabinetId || !masterId || !slaveId || !moduleId || !code || !name || !type || !channel) {
        alert('所有带*的字段都不能为空！');
        return;
    }

    // 检查编号是否重复（编辑时排除自己）
    const isDuplicate = currentData.signals.some(signal =>
        signal.code === code && signal.id !== id);

    if (isDuplicate) {
        alert('信号编号已存在！');
        return;
    }

    if (id) {
        // 编辑现有信号
        const index = currentData.signals.findIndex(s => s.id === id);
        if (index !== -1) {
            currentData.signals[index] = {
                ...currentData.signals[index],
                cabinetId,
                masterId,
                slaveId,
                moduleId,
                code,
                name,
                type,
                channel: parseInt(channel),
                unit: unit || null,
                rangeMin: rangeMin ? parseFloat(rangeMin) : null,
                rangeMax: rangeMax ? parseFloat(rangeMax) : null,
                description
            };
        }
    } else {
        // 添加新信号
        const newSignal = {
            id: generateId(),
            cabinetId,
            masterId,
            slaveId,
            moduleId,
            code,
            name,
            type,
            channel: parseInt(channel),
            unit: unit || null,
            rangeMin: rangeMin ? parseFloat(rangeMin) : null,
            rangeMax: rangeMax ? parseFloat(rangeMax) : null,
            currentValue: null,
            description,
            status: 'online',
            createTime: new Date().toLocaleString()
        };
        currentData.signals.push(newSignal);
    }

    saveAllData();
    refreshSignalView();

    // 关闭模态框
    const modal = bootstrap.Modal.getInstance(document.getElementById('signalModal'));
    modal.hide();
}

// 信号全选功能
function toggleSelectAllSignals() {
    const selectAllCheckbox = document.getElementById('select-all-signals');
    const signalCheckboxes = document.querySelectorAll('.signal-checkbox');

    signalCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}

// 运行选中的信号
function runSelectedSignals() {
    const selectedSignals = [];
    const checkboxes = document.querySelectorAll('.signal-checkbox:checked');

    checkboxes.forEach(checkbox => {
        const signalName = checkbox.getAttribute('data-signal-name');
        const signalId = checkbox.value;
        selectedSignals.push({
            id: signalId,
            name: signalName
        });
    });

    if (selectedSignals.length === 0) {
        alert('请先选择要运行的信号！');
        return;
    }

    // 显示选中的信号名称
    const signalNames = selectedSignals.map(s => s.name).join(', ');
    alert(`正在运行以下信号：\n\n${signalNames}\n\n共 ${selectedSignals.length} 个信号`);

    // 这里可以添加实际的运行逻辑
    // 例如：调用API、更新信号状态等
    console.log('运行选中的信号：', selectedSignals);
}

// ==================== 设置功能 ====================

// 修改密码
function changePassword() {
    const newPassword = prompt('请输入新密码：');
    if (newPassword) {
        // 这里应该调用修改密码的API
        alert('密码修改成功！');
    }
}

// 注销
function logout() {
    if (confirm('确定要注销吗？')) {
        // 这里应该调用注销的API
        alert('注销成功！');
        // 在实际应用中，这里应该跳转到登录页面
        // window.location.href = '/login.html';
    }
}

// 立即备份
function backupNow() {
    alert('开始数据备份...');
    // 这里应该调用备份API
    setTimeout(() => {
        alert('数据备份完成！');
    }, 2000);
}

// 恢复备份
function restoreBackup() {
    alert('开始恢复备份...');
    // 这里应该调用恢复备份API
    setTimeout(() => {
        alert('备份恢复完成！');
    }, 2000);
}

// 清空日志
function clearLogs() {
    if (confirm('确定要清空所有日志吗？此操作不可恢复！')) {
        alert('日志已清空！');
        // 这里应该调用清空日志的API
    }
}

// 导出日志
function exportLogs() {
    alert('开始导出日志...');
    // 这里应该调用导出日志的API
    setTimeout(() => {
        alert('日志导出完成！');
    }, 2000);
}

// ==================== 删除功能 ====================

// 确认删除项目
function confirmDeleteItem(type, id, name) {
    deleteInfo.type = type;
    deleteInfo.id = id;
    deleteInfo.name = name;

    let message = '';
    switch (type) {
        case 'cabinet':
            // 检查是否有下属设备
            const masterCount = currentData.masters.filter(m => m.cabinetId === id).length;
            const slaveCount = currentData.slaves.filter(s => s.cabinetId === id).length;
            const moduleCount = currentData.modules.filter(m => m.cabinetId === id).length;
            const signalCount = currentData.signals.filter(s => s.cabinetId === id).length;

            message = `确定要删除机柜"${name}"吗？`;
            if (masterCount > 0 || slaveCount > 0 || moduleCount > 0 || signalCount > 0) {
                message += `\n该机柜下包含：${masterCount}个主站，${slaveCount}个从站，${moduleCount}个模块，${signalCount}个信号，删除将同时删除所有下属设备！`;
            }
            break;
        case 'master':
            // 检查是否有下属设备
            const slaveCount2 = currentData.slaves.filter(s => s.masterId === id).length;
            const moduleCount2 = currentData.modules.filter(m => m.masterId === id).length;
            const signalCount2 = currentData.signals.filter(s => s.masterId === id).length;

            message = `确定要删除主站"${name}"吗？`;
            if (slaveCount2 > 0 || moduleCount2 > 0 || signalCount2 > 0) {
                message += `\n该主站下包含：${slaveCount2}个从站，${moduleCount2}个模块，${signalCount2}个信号，删除将同时删除所有下属设备！`;
            }
            break;
        case 'slave':
            // 检查是否有下属设备
            const moduleCount3 = currentData.modules.filter(m => m.slaveId === id).length;
            const signalCount3 = currentData.signals.filter(s => s.slaveId === id).length;

            message = `确定要删除从站"${name}"吗？`;
            if (moduleCount3 > 0 || signalCount3 > 0) {
                message += `\n该从站下包含：${moduleCount3}个模块，${signalCount3}个信号，删除将同时删除所有下属设备！`;
            }
            break;
        case 'module':
            // 检查是否有下属设备
            const signalCount4 = currentData.signals.filter(s => s.moduleId === id).length;

            message = `确定要删除模块"${name}"吗？`;
            if (signalCount4 > 0) {
                message += `\n该模块下包含：${signalCount4}个信号，删除将同时删除所有下属设备！`;
            }
            break;
        case 'signal':
            message = `确定要删除信号"${name}"吗？`;
            break;
    }

    document.getElementById('delete-message').innerHTML = message.replace(/\n/g, '<br>');
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
}

// 确认删除
function confirmDelete() {
    const { type, id } = deleteInfo;

    switch (type) {
        case 'cabinet':
            // 删除机柜及其所有下属设备
            currentData.cabinets = currentData.cabinets.filter(c => c.id !== id);
            currentData.masters = currentData.masters.filter(m => m.cabinetId !== id);
            currentData.slaves = currentData.slaves.filter(s => s.cabinetId !== id);
            currentData.modules = currentData.modules.filter(m => m.cabinetId !== id);
            currentData.signals = currentData.signals.filter(s => s.cabinetId !== id);
            break;
        case 'master':
            // 删除主站及其所有下属设备
            currentData.masters = currentData.masters.filter(m => m.id !== id);
            currentData.slaves = currentData.slaves.filter(s => s.masterId !== id);
            currentData.modules = currentData.modules.filter(m => m.masterId !== id);
            currentData.signals = currentData.signals.filter(s => s.masterId !== id);
            break;
        case 'slave':
            // 删除从站及其所有下属设备
            currentData.slaves = currentData.slaves.filter(s => s.id !== id);
            currentData.modules = currentData.modules.filter(m => m.slaveId !== id);
            currentData.signals = currentData.signals.filter(s => s.slaveId !== id);
            break;
        case 'module':
            // 删除模块及其所有下属设备
            currentData.modules = currentData.modules.filter(m => m.id !== id);
            currentData.signals = currentData.signals.filter(s => s.moduleId !== id);
            break;
        case 'signal':
            currentData.signals = currentData.signals.filter(s => s.id !== id);
            break;
    }

    saveAllData();

    // 刷新所有视图
    refreshCabinetView();
    refreshMasterView();
    refreshSlaveView();
    refreshModuleView();
    refreshSignalView();
    updateFilterSelects();

    // 关闭模态框
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
    modal.hide();
}