// management.js - 适配 Django REST API 版本

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

// API 基础路径（可根据实际情况调整，这里假设 API 挂载在 /api/ 下）
const API_BASE = '/api';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadAllData();                  // 从后端加载数据
    updateTime();
    setInterval(updateTime, 1000);
    initFilterSelects();

    // 监听模态框关闭事件，重置表单
    const modals = ['cabinetModal', 'masterModal', 'slaveModal', 'moduleModal', 'signalModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        modal.addEventListener('hidden.bs.modal', function () {
            const form = document.getElementById(modalId.replace('Modal', 'Form'));
            if (form) form.reset();
        });
    });
});

// ==================== 通用 API 请求函数 ====================
async function apiRequest(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        // DELETE 请求可能没有响应体
        if (method === 'DELETE') {
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('API 请求失败:', error);
        alert(`请求失败: ${error.message}`);
        throw error; // 让调用者处理
    }
}

// ==================== 加载所有数据 ====================
async function loadAllData() {
    try {
        const [cabinets, masters, slaves, modules, signals] = await Promise.all([
            apiRequest(`${API_BASE}/cabinets/`),
            apiRequest(`${API_BASE}/masters/`),
            apiRequest(`${API_BASE}/slaves/`),
            apiRequest(`${API_BASE}/modules/`),
            apiRequest(`${API_BASE}/signals/`)
        ]);

        currentData.cabinets = cabinets;
        currentData.masters = masters;
        currentData.slaves = slaves;
        currentData.modules = modules;
        currentData.signals = signals;

        // 刷新所有视图
        refreshCabinetView();
        refreshMasterView();
        refreshSlaveView();
        refreshModuleView();
        refreshSignalView();
        updateFilterSelects();
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败，请检查网络或后端服务');
    }
}

// ==================== 工具函数 ====================
function generateId() {
    // 生成一个简单的唯一ID（与之前 localStorage 版本兼容）
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function updateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent =
        now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
}

function showModule(moduleId) {
    document.querySelectorAll('.module').forEach(module => {
        module.classList.remove('active');
    });
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.getElementById(moduleId).classList.add('active');
    event.currentTarget.classList.add('active');
    updateFilterSelects();  // 切换模块时更新过滤器下拉框
}

// ==================== 过滤器初始化与更新 ====================
function initFilterSelects() {
    const cabinetFilters = ['master-cabinet-filter', 'slave-cabinet-filter', 'module-cabinet-filter', 'signal-cabinet-filter'];
    cabinetFilters.forEach(id => {
        const select = document.getElementById(id);
        if (select) select.innerHTML = '<option value="">全部机柜</option>';
    });

    const masterFilters = ['slave-master-filter', 'module-master-filter', 'signal-master-filter'];
    masterFilters.forEach(id => {
        const select = document.getElementById(id);
        if (select) select.innerHTML = '<option value="">全部主站</option>';
    });

    const slaveFilters = ['module-slave-filter', 'signal-slave-filter'];
    slaveFilters.forEach(id => {
        const select = document.getElementById(id);
        if (select) select.innerHTML = '<option value="">全部从站</option>';
    });

    const moduleFilter = document.getElementById('signal-module-filter');
    if (moduleFilter) moduleFilter.innerHTML = '<option value="">全部模块</option>';
}

function updateFilterSelects() {
    // 更新所有机柜过滤器
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

    // 更新从站管理中的主站过滤器
    updateMasterFilter();
    // 更新模块管理中的主站过滤器
    updateModuleMasterFilter();
    // 更新信号管理中的主站过滤器
    updateSignalMasterFilter();
}

// 以下过滤器更新函数与之前相同，但需要基于 currentData 操作
function updateMasterFilter() {
    const cabinetId = document.getElementById('slave-cabinet-filter')?.value;
    const masterFilter = document.getElementById('slave-master-filter');
    if (!masterFilter) return;
    const currentValue = masterFilter.value;
    masterFilter.innerHTML = '<option value="">全部主站</option>';
    const filteredMasters = cabinetId
        ? currentData.masters.filter(m => m.cabinetId === cabinetId)
        : currentData.masters;
    filteredMasters.forEach(master => {
        const option = document.createElement('option');
        option.value = master.id;
        option.textContent = `${master.code} - ${master.name}`;
        masterFilter.appendChild(option);
    });
    masterFilter.value = currentValue;
}

function updateModuleMasterFilter() {
    const cabinetId = document.getElementById('module-cabinet-filter')?.value;
    const masterFilter = document.getElementById('module-master-filter');
    if (!masterFilter) return;
    const currentValue = masterFilter.value;
    masterFilter.innerHTML = '<option value="">全部主站</option>';
    const filteredMasters = cabinetId
        ? currentData.masters.filter(m => m.cabinetId === cabinetId)
        : currentData.masters;
    filteredMasters.forEach(master => {
        const option = document.createElement('option');
        option.value = master.id;
        option.textContent = `${master.code} - ${master.name}`;
        masterFilter.appendChild(option);
    });
    masterFilter.value = currentValue;
    updateModuleSlaveFilter();
}

function updateModuleSlaveFilter() {
    const masterId = document.getElementById('module-master-filter')?.value;
    const slaveFilter = document.getElementById('module-slave-filter');
    if (!slaveFilter) return;
    const currentValue = slaveFilter.value;
    slaveFilter.innerHTML = '<option value="">全部从站</option>';
    const filteredSlaves = masterId
        ? currentData.slaves.filter(s => s.masterId === masterId)
        : currentData.slaves;
    filteredSlaves.forEach(slave => {
        const option = document.createElement('option');
        option.value = slave.id;
        option.textContent = `${slave.code} - ${slave.name}`;
        slaveFilter.appendChild(option);
    });
    slaveFilter.value = currentValue;
}

function updateSignalMasterFilter() {
    const cabinetId = document.getElementById('signal-cabinet-filter')?.value;
    const masterFilter = document.getElementById('signal-master-filter');
    if (!masterFilter) return;
    const currentValue = masterFilter.value;
    masterFilter.innerHTML = '<option value="">全部主站</option>';
    const filteredMasters = cabinetId
        ? currentData.masters.filter(m => m.cabinetId === cabinetId)
        : currentData.masters;
    filteredMasters.forEach(master => {
        const option = document.createElement('option');
        option.value = master.id;
        option.textContent = `${master.code} - ${master.name}`;
        masterFilter.appendChild(option);
    });
    masterFilter.value = currentValue;
    updateSignalSlaveFilter();
}

function updateSignalSlaveFilter() {
    const masterId = document.getElementById('signal-master-filter')?.value;
    const slaveFilter = document.getElementById('signal-slave-filter');
    if (!slaveFilter) return;
    const currentValue = slaveFilter.value;
    slaveFilter.innerHTML = '<option value="">全部从站</option>';
    let filteredSlaves = currentData.slaves;
    if (masterId) {
        filteredSlaves = filteredSlaves.filter(s => s.masterId === masterId);
    }
    filteredSlaves.forEach(slave => {
        const option = document.createElement('option');
        option.value = slave.id;
        option.textContent = `${slave.code} - ${slave.name}`;
        slaveFilter.appendChild(option);
    });
    slaveFilter.value = currentValue;
    updateSignalModuleFilter();
}

function updateSignalModuleFilter() {
    const slaveId = document.getElementById('signal-slave-filter')?.value;
    const moduleFilter = document.getElementById('signal-module-filter');
    if (!moduleFilter) return;
    const currentValue = moduleFilter.value;
    moduleFilter.innerHTML = '<option value="">全部模块</option>';
    if (slaveId) {
        const filteredModules = currentData.modules.filter(m => m.slaveId === slaveId);
        filteredModules.forEach(module => {
            const option = document.createElement('option');
            option.value = module.id;
            option.textContent = `${module.code} - ${module.name}`;
            moduleFilter.appendChild(option);
        });
    }
    moduleFilter.value = currentValue;
}

// ==================== 机柜管理 ====================
function refreshCabinetView() {
    const searchTerm = document.getElementById('cabinet-search').value.toLowerCase();
    const filteredCabinets = searchTerm
        ? currentData.cabinets.filter(c =>
            c.code.toLowerCase().includes(searchTerm) ||
            c.name.toLowerCase().includes(searchTerm) ||
            (c.location && c.location.toLowerCase().includes(searchTerm))
        )
        : currentData.cabinets;

    const tbody = document.getElementById('cabinet-table-body');
    tbody.innerHTML = '';

    filteredCabinets.forEach(cabinet => {
        const masterCount = currentData.masters.filter(m => m.cabinetId === cabinet.id).length;
        const slaveCount = currentData.slaves.filter(s => s.cabinetId === cabinet.id).length;
        const moduleCount = currentData.modules.filter(m => m.cabinetId === cabinet.id).length;

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
            <td>${cabinet.createTime || cabinet.create_time}</td>
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

function searchCabinets() {
    refreshCabinetView();
}

function showAddCabinetModal() {
    document.getElementById('cabinetModalTitle').textContent = '新增机柜';
    document.getElementById('cabinet-id').value = '';
    document.getElementById('cabinet-code').value = '';
    document.getElementById('cabinet-name').value = '';
    document.getElementById('cabinet-location').value = '';
    document.getElementById('cabinet-description').value = '';
    new bootstrap.Modal(document.getElementById('cabinetModal')).show();
}

function editCabinet(id) {
    const cabinet = currentData.cabinets.find(c => c.id === id);
    if (!cabinet) return;

    document.getElementById('cabinetModalTitle').textContent = '编辑机柜';
    document.getElementById('cabinet-id').value = cabinet.id;
    document.getElementById('cabinet-code').value = cabinet.code;
    document.getElementById('cabinet-name').value = cabinet.name;
    document.getElementById('cabinet-location').value = cabinet.location || '';
    document.getElementById('cabinet-description').value = cabinet.description || '';
    new bootstrap.Modal(document.getElementById('cabinetModal')).show();
}

async function saveCabinet() {
    const id = document.getElementById('cabinet-id').value;
    const code = document.getElementById('cabinet-code').value.trim();
    const name = document.getElementById('cabinet-name').value.trim();
    const location = document.getElementById('cabinet-location').value.trim();
    const description = document.getElementById('cabinet-description').value.trim();

    if (!code || !name) {
        alert('机柜编号和名称不能为空！');
        return;
    }

    const data = { code, name, location, description };
    if (!id) {
        data.id = generateId(); // 新增时生成ID
    }

    try {
        if (id) {
            await apiRequest(`${API_BASE}/cabinets/${id}/`, 'PUT', data);
        } else {
            await apiRequest(`${API_BASE}/cabinets/`, 'POST', data);
        }
        await loadAllData();
        bootstrap.Modal.getInstance(document.getElementById('cabinetModal')).hide();
    } catch (error) {
        console.error('保存机柜失败:', error);
        alert('保存失败，请重试');
    }
}

// ==================== 主站管理 ====================
function refreshMasterView() {
    const searchTerm = document.getElementById('master-search').value.toLowerCase();
    const cabinetId = document.getElementById('master-cabinet-filter').value;

    let filteredMasters = currentData.masters;
    if (searchTerm) {
        filteredMasters = filteredMasters.filter(m =>
            m.code.toLowerCase().includes(searchTerm) ||
            m.name.toLowerCase().includes(searchTerm) ||
            m.ip.toLowerCase().includes(searchTerm)
        );
    }
    if (cabinetId) {
        filteredMasters = filteredMasters.filter(m => m.cabinetId === cabinetId);
    }

    const tbody = document.getElementById('master-table-body');
    tbody.innerHTML = '';

    filteredMasters.forEach(master => {
        const cabinet = currentData.cabinets.find(c => c.id === master.cabinetId);
        const cabinetName = cabinet ? `${cabinet.code} - ${cabinet.name}` : '未知机柜';
        const slaveCount = currentData.slaves.filter(s => s.masterId === master.id).length;
        const moduleCount = currentData.modules.filter(m => m.masterId === master.id).length;

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
            <td>${master.createTime || master.create_time}</td>
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

function searchMasters() { refreshMasterView(); }
function resetMasterFilter() {
    document.getElementById('master-search').value = '';
    document.getElementById('master-cabinet-filter').value = '';
    refreshMasterView();
}

function showAddMasterModal() {
    document.getElementById('masterModalTitle').textContent = '新增主站';
    document.getElementById('master-id').value = '';
    document.getElementById('masterForm').reset();

    const cabinetSelect = document.getElementById('master-cabinet');
    cabinetSelect.innerHTML = '<option value="">请选择机柜</option>';
    currentData.cabinets.forEach(cabinet => {
        const option = document.createElement('option');
        option.value = cabinet.id;
        option.textContent = `${cabinet.code} - ${cabinet.name}`;
        cabinetSelect.appendChild(option);
    });
    new bootstrap.Modal(document.getElementById('masterModal')).show();
}

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

    const cabinetSelect = document.getElementById('master-cabinet');
    cabinetSelect.innerHTML = '<option value="">请选择机柜</option>';
    currentData.cabinets.forEach(cabinet => {
        const option = document.createElement('option');
        option.value = cabinet.id;
        option.textContent = `${cabinet.code} - ${cabinet.name}`;
        option.selected = cabinet.id === master.cabinetId;
        cabinetSelect.appendChild(option);
    });
    new bootstrap.Modal(document.getElementById('masterModal')).show();
}

async function saveMaster() {
    const id = document.getElementById('master-id').value;
    const cabinetId = document.getElementById('master-cabinet').value;
    const code = document.getElementById('master-code').value.trim();
    const name = document.getElementById('master-name').value.trim();
    const ip = document.getElementById('master-ip').value.trim();
    const port = document.getElementById('master-port').value.trim();
    const description = document.getElementById('master-description').value.trim();

    if (!cabinetId || !code || !name || !ip || !port) {
        alert('所有带*的字段都不能为空！');
        return;
    }
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
        alert('IP地址格式不正确！');
        return;
    }

    const data = { cabinetId, code, name, ip, port: parseInt(port), description };
    if (!id) data.id = generateId();

    try {
        if (id) {
            await apiRequest(`${API_BASE}/masters/${id}/`, 'PUT', data);
        } else {
            await apiRequest(`${API_BASE}/masters/`, 'POST', data);
        }
        await loadAllData();
        bootstrap.Modal.getInstance(document.getElementById('masterModal')).hide();
    } catch (error) {
        console.error('保存主站失败:', error);
        alert('保存失败，请重试');
    }
}

// ==================== 从站管理 ====================
function updateMasterSelect() {
    const cabinetId = document.getElementById('slave-cabinet').value;
    const masterSelect = document.getElementById('slave-master');
    masterSelect.innerHTML = '<option value="">请选择主站</option>';
    if (cabinetId) {
        const filteredMasters = currentData.masters.filter(m => m.cabinetId === cabinetId);
        filteredMasters.forEach(master => {
            const option = document.createElement('option');
            option.value = master.id;
            option.textContent = `${master.code} - ${master.name}`;
            masterSelect.appendChild(option);
        });
    }
}

function refreshSlaveView() {
    const searchTerm = document.getElementById('slave-search').value.toLowerCase();
    const cabinetId = document.getElementById('slave-cabinet-filter').value;
    const masterId = document.getElementById('slave-master-filter').value;

    let filteredSlaves = currentData.slaves;
    if (searchTerm) {
        filteredSlaves = filteredSlaves.filter(s =>
            s.code.toLowerCase().includes(searchTerm) ||
            s.name.toLowerCase().includes(searchTerm)
        );
    }
    if (cabinetId) {
        filteredSlaves = filteredSlaves.filter(s => s.cabinetId === cabinetId);
    }
    if (masterId) {
        filteredSlaves = filteredSlaves.filter(s => s.masterId === masterId);
    }

    const tbody = document.getElementById('slave-table-body');
    tbody.innerHTML = '';

    filteredSlaves.forEach(slave => {
        const cabinet = currentData.cabinets.find(c => c.id === slave.cabinetId);
        const master = currentData.masters.find(m => m.id === slave.masterId);
        const cabinetName = cabinet ? `${cabinet.code} - ${cabinet.name}` : '未知机柜';
        const masterName = master ? `${master.code} - ${master.name}` : '未知主站';
        const moduleCount = currentData.modules.filter(m => m.slaveId === slave.id).length;
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
            <td>${slave.createTime || slave.create_time}</td>
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

function searchSlaves() { refreshSlaveView(); }
function resetSlaveFilter() {
    document.getElementById('slave-search').value = '';
    document.getElementById('slave-cabinet-filter').value = '';
    document.getElementById('slave-master-filter').value = '';
    refreshSlaveView();
}

function showAddSlaveModal() {
    document.getElementById('slaveModalTitle').textContent = '新增从站';
    document.getElementById('slave-id').value = '';
    document.getElementById('slaveForm').reset();

    const cabinetSelect = document.getElementById('slave-cabinet');
    cabinetSelect.innerHTML = '<option value="">请选择机柜</option>';
    currentData.cabinets.forEach(cabinet => {
        const option = document.createElement('option');
        option.value = cabinet.id;
        option.textContent = `${cabinet.code} - ${cabinet.name}`;
        cabinetSelect.appendChild(option);
    });
    document.getElementById('slave-master').innerHTML = '<option value="">请选择主站</option>';
    new bootstrap.Modal(document.getElementById('slaveModal')).show();
}

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

    const cabinetSelect = document.getElementById('slave-cabinet');
    cabinetSelect.innerHTML = '<option value="">请选择机柜</option>';
    currentData.cabinets.forEach(cabinet => {
        const option = document.createElement('option');
        option.value = cabinet.id;
        option.textContent = `${cabinet.code} - ${cabinet.name}`;
        option.selected = cabinet.id === slave.cabinetId;
        cabinetSelect.appendChild(option);
    });

    updateMasterSelect();
    setTimeout(() => {
        document.getElementById('slave-master').value = slave.masterId;
    }, 100);

    new bootstrap.Modal(document.getElementById('slaveModal')).show();
}

async function saveSlave() {
    const id = document.getElementById('slave-id').value;
    const cabinetId = document.getElementById('slave-cabinet').value;
    const masterId = document.getElementById('slave-master').value;
    const code = document.getElementById('slave-code').value.trim();
    const name = document.getElementById('slave-name').value.trim();
    const address = document.getElementById('slave-address').value.trim();
    const protocol = document.getElementById('slave-protocol').value;
    const description = document.getElementById('slave-description').value.trim();

    if (!cabinetId || !masterId || !code || !name || !address || !protocol) {
        alert('所有带*的字段都不能为空！');
        return;
    }

    const data = { cabinetId, masterId, code, name, address: parseInt(address), protocol, description };
    if (!id) data.id = generateId();

    try {
        if (id) {
            await apiRequest(`${API_BASE}/slaves/${id}/`, 'PUT', data);
        } else {
            await apiRequest(`${API_BASE}/slaves/`, 'POST', data);
        }
        await loadAllData();
        bootstrap.Modal.getInstance(document.getElementById('slaveModal')).hide();
    } catch (error) {
        console.error('保存从站失败:', error);
        alert('保存失败，请重试');
    }
}

// ==================== 模块管理 ====================
function updateModuleMasterSelect() {
    const cabinetId = document.getElementById('module-cabinet').value;
    const masterSelect = document.getElementById('module-master');
    masterSelect.innerHTML = '<option value="">请选择主站</option>';
    if (cabinetId) {
        const filteredMasters = currentData.masters.filter(m => m.cabinetId === cabinetId);
        filteredMasters.forEach(master => {
            const option = document.createElement('option');
            option.value = master.id;
            option.textContent = `${master.code} - ${master.name}`;
            masterSelect.appendChild(option);
        });
    }
    updateModuleSlaveSelect();
}

function updateModuleSlaveSelect() {
    const masterId = document.getElementById('module-master').value;
    const slaveSelect = document.getElementById('module-slave');
    slaveSelect.innerHTML = '<option value="">请选择从站</option>';
    if (masterId) {
        const filteredSlaves = currentData.slaves.filter(s => s.masterId === masterId);
        filteredSlaves.forEach(slave => {
            const option = document.createElement('option');
            option.value = slave.id;
            option.textContent = `${slave.code} - ${slave.name}`;
            slaveSelect.appendChild(option);
        });
    }
}

function refreshModuleView() {
    const searchTerm = document.getElementById('module-search').value.toLowerCase();
    const cabinetId = document.getElementById('module-cabinet-filter').value;
    const masterId = document.getElementById('module-master-filter').value;
    const slaveId = document.getElementById('module-slave-filter').value;

    let filteredModules = currentData.modules;
    if (searchTerm) {
        filteredModules = filteredModules.filter(m =>
            m.code.toLowerCase().includes(searchTerm) ||
            m.name.toLowerCase().includes(searchTerm) ||
            m.type.toLowerCase().includes(searchTerm)
        );
    }
    if (cabinetId) filteredModules = filteredModules.filter(m => m.cabinetId === cabinetId);
    if (masterId) filteredModules = filteredModules.filter(m => m.masterId === masterId);
    if (slaveId) filteredModules = filteredModules.filter(m => m.slaveId === slaveId);

    const tbody = document.getElementById('module-table-body');
    tbody.innerHTML = '';

    filteredModules.forEach(module => {
        const cabinet = currentData.cabinets.find(c => c.id === module.cabinetId);
        const master = currentData.masters.find(m => m.id === module.masterId);
        const slave = currentData.slaves.find(s => s.id === module.slaveId);
        const cabinetName = cabinet ? `${cabinet.code} - ${cabinet.name}` : '未知机柜';
        const masterName = master ? `${master.code} - ${master.name}` : '未知主站';
        const slaveName = slave ? `${slave.code} - ${slave.name}` : '未知从站';
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
            <td>${module.createTime || module.create_time}</td>
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

function searchModules() { refreshModuleView(); }
function resetModuleFilter() {
    document.getElementById('module-search').value = '';
    document.getElementById('module-cabinet-filter').value = '';
    document.getElementById('module-master-filter').value = '';
    document.getElementById('module-slave-filter').value = '';
    refreshModuleView();
}

function showAddModuleModal() {
    document.getElementById('moduleModalTitle').textContent = '新增模块';
    document.getElementById('module-id').value = '';
    document.getElementById('moduleForm').reset();

    const cabinetSelect = document.getElementById('module-cabinet');
    cabinetSelect.innerHTML = '<option value="">请选择机柜</option>';
    currentData.cabinets.forEach(cabinet => {
        const option = document.createElement('option');
        option.value = cabinet.id;
        option.textContent = `${cabinet.code} - ${cabinet.name}`;
        cabinetSelect.appendChild(option);
    });
    document.getElementById('module-master').innerHTML = '<option value="">请选择主站</option>';
    document.getElementById('module-slave').innerHTML = '<option value="">请选择从站</option>';
    new bootstrap.Modal(document.getElementById('moduleModal')).show();
}

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

    const cabinetSelect = document.getElementById('module-cabinet');
    cabinetSelect.innerHTML = '<option value="">请选择机柜</option>';
    currentData.cabinets.forEach(cabinet => {
        const option = document.createElement('option');
        option.value = cabinet.id;
        option.textContent = `${cabinet.code} - ${cabinet.name}`;
        option.selected = cabinet.id === module.cabinetId;
        cabinetSelect.appendChild(option);
    });

    updateModuleMasterSelect();
    setTimeout(() => {
        document.getElementById('module-master').value = module.masterId;
        updateModuleSlaveSelect();
        setTimeout(() => {
            document.getElementById('module-slave').value = module.slaveId;
        }, 100);
    }, 100);
    new bootstrap.Modal(document.getElementById('moduleModal')).show();
}

async function saveModule() {
    const id = document.getElementById('module-id').value;
    const cabinetId = document.getElementById('module-cabinet').value;
    const masterId = document.getElementById('module-master').value;
    const slaveId = document.getElementById('module-slave').value;
    const code = document.getElementById('module-code').value.trim();
    const name = document.getElementById('module-name').value.trim();
    const type = document.getElementById('module-type').value;
    const channels = document.getElementById('module-channels').value.trim();
    const description = document.getElementById('module-description').value.trim();

    if (!cabinetId || !masterId || !slaveId || !code || !name || !type || !channels) {
        alert('所有带*的字段都不能为空！');
        return;
    }

    const data = { cabinetId, masterId, slaveId, code, name, type, channels: parseInt(channels), description };
    if (!id) data.id = generateId();

    try {
        if (id) {
            await apiRequest(`${API_BASE}/modules/${id}/`, 'PUT', data);
        } else {
            await apiRequest(`${API_BASE}/modules/`, 'POST', data);
        }
        await loadAllData();
        bootstrap.Modal.getInstance(document.getElementById('moduleModal')).hide();
    } catch (error) {
        console.error('保存模块失败:', error);
        alert('保存失败，请重试');
    }
}

// ==================== 信号管理 ====================
function updateSignalMasterSelect() {
    const cabinetId = document.getElementById('signal-cabinet').value;
    const masterSelect = document.getElementById('signal-master');
    masterSelect.innerHTML = '<option value="">请选择主站</option>';
    if (cabinetId) {
        const filteredMasters = currentData.masters.filter(m => m.cabinetId === cabinetId);
        filteredMasters.forEach(master => {
            const option = document.createElement('option');
            option.value = master.id;
            option.textContent = `${master.code} - ${master.name}`;
            masterSelect.appendChild(option);
        });
    }
    updateSignalSlaveSelect();
}

function updateSignalSlaveSelect() {
    const masterId = document.getElementById('signal-master').value;
    const slaveSelect = document.getElementById('signal-slave');
    slaveSelect.innerHTML = '<option value="">请选择从站</option>';
    if (masterId) {
        const filteredSlaves = currentData.slaves.filter(s => s.masterId === masterId);
        filteredSlaves.forEach(slave => {
            const option = document.createElement('option');
            option.value = slave.id;
            option.textContent = `${slave.code} - ${slave.name}`;
            slaveSelect.appendChild(option);
        });
    }
    updateSignalModuleSelect();
}

function updateSignalModuleSelect() {
    const slaveId = document.getElementById('signal-slave').value;
    const moduleSelect = document.getElementById('signal-module');
    moduleSelect.innerHTML = '<option value="">请选择模块</option>';
    if (slaveId) {
        const filteredModules = currentData.modules.filter(m => m.slaveId === slaveId);
        filteredModules.forEach(module => {
            const option = document.createElement('option');
            option.value = module.id;
            option.textContent = `${module.code} - ${module.name}`;
            moduleSelect.appendChild(option);
        });
    }
}

function refreshSignalView() {
    const searchTerm = document.getElementById('signal-search').value.toLowerCase();
    const cabinetId = document.getElementById('signal-cabinet-filter').value;
    const masterId = document.getElementById('signal-master-filter').value;
    const slaveId = document.getElementById('signal-slave-filter').value;
    const moduleId = document.getElementById('signal-module-filter').value;

    let filteredSignals = currentData.signals;
    if (searchTerm) {
        filteredSignals = filteredSignals.filter(s =>
            s.code.toLowerCase().includes(searchTerm) ||
            s.name.toLowerCase().includes(searchTerm)
        );
    }
    if (cabinetId) filteredSignals = filteredSignals.filter(s => s.cabinetId === cabinetId);
    if (masterId) filteredSignals = filteredSignals.filter(s => s.masterId === masterId);
    if (slaveId) filteredSignals = filteredSignals.filter(s => s.slaveId === slaveId);
    if (moduleId) filteredSignals = filteredSignals.filter(s => s.moduleId === moduleId);

    const tbody = document.getElementById('signal-table-body');
    tbody.innerHTML = '';

    filteredSignals.forEach(signal => {
        const cabinet = currentData.cabinets.find(c => c.id === signal.cabinetId);
        const master = currentData.masters.find(m => m.id === signal.masterId);
        const slave = currentData.slaves.find(s => s.id === signal.slaveId);
        const module = currentData.modules.find(m => m.id === signal.moduleId);
        const cabinetName = cabinet ? cabinet.code : '未知机柜';
        const masterName = master ? master.code : '未知主站';
        const slaveName = slave ? slave.code : '未知从站';
        const moduleName = module ? module.code : '未知模块';
        const path = `${cabinetName} > ${masterName} > ${slaveName} > ${moduleName}`;

        const typeNames = {
            'AI': '模拟量输入(AI)',
            'AO': '模拟量输出(AO)',
            'DI': '数字量输入(DI)',
            'DO': '数字量输出(DO)',
            'RTD': '温度(RTD)',
            'TC': '热电偶(TC)',
            'PO': '脉冲输出(PO)'
        };

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
            <td>${signal.createTime || signal.create_time}</td>
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

function searchSignals() { refreshSignalView(); }
function resetSignalFilter() {
    document.getElementById('signal-search').value = '';
    document.getElementById('signal-cabinet-filter').value = '';
    document.getElementById('signal-master-filter').value = '';
    document.getElementById('signal-slave-filter').value = '';
    document.getElementById('signal-module-filter').value = '';
    refreshSignalView();
}

function showAddSignalModal() {
    document.getElementById('signalModalTitle').textContent = '新增信号';
    document.getElementById('signal-id').value = '';
    document.getElementById('signalForm').reset();

    const cabinetSelect = document.getElementById('signal-cabinet');
    cabinetSelect.innerHTML = '<option value="">请选择机柜</option>';
    currentData.cabinets.forEach(cabinet => {
        const option = document.createElement('option');
        option.value = cabinet.id;
        option.textContent = `${cabinet.code} - ${cabinet.name}`;
        cabinetSelect.appendChild(option);
    });
    document.getElementById('signal-master').innerHTML = '<option value="">请选择主站</option>';
    document.getElementById('signal-slave').innerHTML = '<option value="">请选择从站</option>';
    document.getElementById('signal-module').innerHTML = '<option value="">请选择模块</option>';
    new bootstrap.Modal(document.getElementById('signalModal')).show();
}

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

    const cabinetSelect = document.getElementById('signal-cabinet');
    cabinetSelect.innerHTML = '<option value="">请选择机柜</option>';
    currentData.cabinets.forEach(cabinet => {
        const option = document.createElement('option');
        option.value = cabinet.id;
        option.textContent = `${cabinet.code} - ${cabinet.name}`;
        option.selected = cabinet.id === signal.cabinetId;
        cabinetSelect.appendChild(option);
    });

    updateSignalMasterSelect();
    setTimeout(() => {
        document.getElementById('signal-master').value = signal.masterId;
        updateSignalSlaveSelect();
        setTimeout(() => {
            document.getElementById('signal-slave').value = signal.slaveId;
            updateSignalModuleSelect();
            setTimeout(() => {
                document.getElementById('signal-module').value = signal.moduleId;
            }, 100);
        }, 100);
    }, 100);
    new bootstrap.Modal(document.getElementById('signalModal')).show();
}

async function saveSignal() {
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

    if (!cabinetId || !masterId || !slaveId || !moduleId || !code || !name || !type || !channel) {
        alert('所有带*的字段都不能为空！');
        return;
    }

    const data = {
        cabinetId, masterId, slaveId, moduleId, code, name, type,
        channel: parseInt(channel),
        unit: unit || null,
        rangeMin: rangeMin ? parseFloat(rangeMin) : null,
        rangeMax: rangeMax ? parseFloat(rangeMax) : null,
        description
    };
    if (!id) data.id = generateId();

    try {
        if (id) {
            await apiRequest(`${API_BASE}/signals/${id}/`, 'PUT', data);
        } else {
            await apiRequest(`${API_BASE}/signals/`, 'POST', data);
        }
        await loadAllData();
        bootstrap.Modal.getInstance(document.getElementById('signalModal')).hide();
    } catch (error) {
        console.error('保存信号失败:', error);
        alert('保存失败，请重试');
    }
}

// 信号全选/运行
function toggleSelectAllSignals() {
    const selectAll = document.getElementById('select-all-signals').checked;
    document.querySelectorAll('.signal-checkbox').forEach(cb => cb.checked = selectAll);
}

function toggleCheckboxes(source) {
    document.querySelectorAll('.signal-checkbox').forEach(cb => cb.checked = source.checked);
    const selectAll = document.getElementById('select-all-signals');
    if (selectAll) selectAll.checked = source.checked;
}

function runSelectedSignals() {
    const selected = Array.from(document.querySelectorAll('.signal-checkbox:checked'))
        .map(cb => cb.getAttribute('data-signal-name'));
    if (selected.length === 0) {
        alert('请先选择要运行的信号！');
        return;
    }
    alert(`正在运行以下信号：\n\n${selected.join(', ')}\n\n共 ${selected.length} 个信号`);
}

// ==================== 设置功能 ====================
function changePassword() {
    const newPwd = prompt('请输入新密码：');
    if (newPwd) alert('密码修改成功！');
}
function logout() {
    if (confirm('确定要注销吗？')) {
        alert('注销成功！');
        // 实际项目中可跳转到登录页： window.location.href = '/login';
    }
}
function backupNow() {
    alert('开始数据备份...');
    setTimeout(() => alert('数据备份完成！'), 2000);
}
function restoreBackup() {
    alert('开始恢复备份...');
    setTimeout(() => alert('备份恢复完成！'), 2000);
}
function clearLogs() {
    if (confirm('确定要清空所有日志吗？此操作不可恢复！')) {
        alert('日志已清空！');
    }
}
function exportLogs() {
    alert('开始导出日志...');
    setTimeout(() => alert('日志导出完成！'), 2000);
}

// ==================== 删除功能 ====================
function confirmDeleteItem(type, id, name) {
    deleteInfo = { type, id, name };
    let message = `确定要删除${type} "${name}" 吗？`;
    // 级联提示（可选，后端已处理级联，前端仅提示）
    document.getElementById('delete-message').innerHTML = message;
    new bootstrap.Modal(document.getElementById('deleteConfirmModal')).show();
}

async function confirmDelete() {
    const { type, id } = deleteInfo;
    try {
        await apiRequest(`${API_BASE}/${type}s/${id}/`, 'DELETE');
        await loadAllData();
        bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败，请重试');
    }
}