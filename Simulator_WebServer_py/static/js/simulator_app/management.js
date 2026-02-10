// 全局变量
let currentData = {
    cabinets: [],
    masters: [],
    slaves: [],
    modules: []
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
    const modals = ['cabinetModal', 'masterModal', 'slaveModal', 'moduleModal'];
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

    // 加载数据后更新所有视图
    refreshCabinetView();
    refreshMasterView();
    refreshSlaveView();
    refreshModuleView();

    // 更新过滤器选项
    updateFilterSelects();
}

// 保存所有数据
function saveAllData() {
    localStorage.setItem('deviceManagementData', JSON.stringify(currentData));
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
    const cabinetFilters = ['master-cabinet-filter', 'slave-cabinet-filter', 'module-cabinet-filter'];
    cabinetFilters.forEach(filterId => {
        const select = document.getElementById(filterId);
        select.innerHTML = '<option value="">全部机柜</option>';
    });

    // 主站过滤器
    const masterFilters = ['slave-master-filter', 'module-master-filter'];
    masterFilters.forEach(filterId => {
        const select = document.getElementById(filterId);
        select.innerHTML = '<option value="">全部主站</option>';
    });

    // 从站过滤器
    const slaveFilter = document.getElementById('module-slave-filter');
    if (slaveFilter) {
        slaveFilter.innerHTML = '<option value="">全部从站</option>';
    }
}

// 更新过滤器下拉框选项
function updateFilterSelects() {
    // 更新机柜过滤器
    const cabinetFilters = ['master-cabinet-filter', 'slave-cabinet-filter', 'module-cabinet-filter'];
    cabinetFilters.forEach(filterId => {
        const select = document.getElementById(filterId);
        if (select) {
            // 保存当前选中的值
            const currentValue = select.value;
            select.innerHTML = '<option value="">全部机柜</option>';
            currentData.cabinets.forEach(cabinet => {
                const option = document.createElement('option');
                option.value = cabinet.id;
                option.textContent = `${cabinet.code} - ${cabinet.name}`;
                select.appendChild(option);
            });
            // 恢复之前选中的值
            select.value = currentValue;
        }
    });

    // 更新主站过滤器
    updateMasterFilter();
    updateModuleMasterFilter();
}

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

// 更新主站过滤器（用于模块管理）
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

// 更新从站过滤器（用于模块管理）
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

            message = `确定要删除机柜"${name}"吗？`;
            if (masterCount > 0 || slaveCount > 0 || moduleCount > 0) {
                message += `\n该机柜下包含：${masterCount}个主站，${slaveCount}个从站，${moduleCount}个模块，删除将同时删除所有下属设备！`;
            }
            break;
        case 'master':
            // 检查是否有下属设备
            const slaveCount2 = currentData.slaves.filter(s => s.masterId === id).length;
            const moduleCount2 = currentData.modules.filter(m => m.masterId === id).length;

            message = `确定要删除主站"${name}"吗？`;
            if (slaveCount2 > 0 || moduleCount2 > 0) {
                message += `\n该主站下包含：${slaveCount2}个从站，${moduleCount2}个模块，删除将同时删除所有下属设备！`;
            }
            break;
        case 'slave':
            // 检查是否有下属设备
            const moduleCount3 = currentData.modules.filter(m => m.slaveId === id).length;

            message = `确定要删除从站"${name}"吗？`;
            if (moduleCount3 > 0) {
                message += `\n该从站下包含：${moduleCount3}个模块，删除将同时删除所有下属设备！`;
            }
            break;
        case 'module':
            message = `确定要删除模块"${name}"吗？`;
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
            break;
        case 'master':
            // 删除主站及其所有下属设备
            currentData.masters = currentData.masters.filter(m => m.id !== id);
            currentData.slaves = currentData.slaves.filter(s => s.masterId !== id);
            currentData.modules = currentData.modules.filter(m => m.masterId !== id);
            break;
        case 'slave':
            // 删除从站及其所有下属设备
            currentData.slaves = currentData.slaves.filter(s => s.id !== id);
            currentData.modules = currentData.modules.filter(m => m.slaveId !== id);
            break;
        case 'module':
            currentData.modules = currentData.modules.filter(m => m.id !== id);
            break;
    }

    saveAllData();

    // 刷新所有视图
    refreshCabinetView();
    refreshMasterView();
    refreshSlaveView();
    refreshModuleView();
    updateFilterSelects();

    // 关闭模态框
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
    modal.hide();
}

// ==================== 工具函数 ====================

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}