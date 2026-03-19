// management.js - 适配 Django REST API (字段名修正版)

// 全局变量
let currentData = {
    cabinets: [],
    masters: [],
    slaves: [],
    modules: [],
    signals: [],
    projects: []
};

let deleteInfo = {
    type: '',
    id: '',
    name: ''
};

const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', function() {
    loadAllData();
    updateTime();
    setInterval(updateTime, 1000);
    initFilterSelects();

    const modals = ['cabinetModal', 'masterModal', 'slaveModal', 'moduleModal', 'signalModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        modal.addEventListener('hidden.bs.modal', function () {
            const form = document.getElementById(modalId.replace('Modal', 'Form'));
            if (form) form.reset();
        });
    });
});

// ==================== 通用 API 请求 ====================
async function apiRequest(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (data) options.body = JSON.stringify(data);
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        if (method === 'DELETE') return null;
        return await response.json();
    } catch (error) {
        console.error('API 请求失败:', error);
        alert(`请求失败: ${error.message}`);
        throw error;
    }
}

// ==================== 加载数据 ====================
async function loadAllData() {
    try {
        const [cabinets, masters, slaves, modules, signals, projects] = await Promise.all([
            apiRequest(`${API_BASE}/cabinets/`),
            apiRequest(`${API_BASE}/masters/`),
            apiRequest(`${API_BASE}/slaves/`),
            apiRequest(`${API_BASE}/modules/`),
            apiRequest(`${API_BASE}/signals/`),
            apiRequest(`${API_BASE}/projects/`)
        ]);

        currentData.cabinets = cabinets;
        currentData.masters = masters;
        currentData.slaves = slaves;
        currentData.modules = modules;
        currentData.signals = signals;
        currentData.projects = projects;

        refreshCabinetView();
        refreshMasterView();
        refreshSlaveView();
        refreshModuleView();
        refreshSignalView();
        refreshProjectView();
        updateFilterSelects();
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败，请检查网络或后端服务');
    }
}

// ==================== 工具函数 ====================
function generateId() {
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
    updateFilterSelects();
    // 新增：控制信号管理定时器
    if (moduleId === 'signal-management') {
        startSignalRefresh();
    } else {
        stopSignalRefresh();
    }
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

    updateMasterFilter();
    updateModuleMasterFilter();
    updateSignalMasterFilter();
}

// 以下过滤器函数中，所有外键字段名已改为后端返回的字段名（如 cabinet, master 等）
function updateMasterFilter() {
    const cabinetId = document.getElementById('slave-cabinet-filter')?.value;
    const masterFilter = document.getElementById('slave-master-filter');
    if (!masterFilter) return;
    const currentValue = masterFilter.value;
    masterFilter.innerHTML = '<option value="">全部主站</option>';
    const filteredMasters = cabinetId
        ? currentData.masters.filter(m => m.cabinet === cabinetId)
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
        ? currentData.masters.filter(m => m.cabinet === cabinetId)
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
        ? currentData.slaves.filter(s => s.master === masterId)
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
        ? currentData.masters.filter(m => m.cabinet === cabinetId)
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
        filteredSlaves = filteredSlaves.filter(s => s.master === masterId);
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
        const filteredModules = currentData.modules.filter(m => m.slave === slaveId);
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
        const masterCount = currentData.masters.filter(m => m.cabinet === cabinet.id).length;
        const slaveCount = currentData.slaves.filter(s => s.cabinet === cabinet.id).length;
        const moduleCount = currentData.modules.filter(m => m.cabinet === cabinet.id).length;

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

function searchCabinets() { refreshCabinetView(); }

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
    if (id) {
        data.id = id;  // 编辑时，将 id 放入 data
    } else {
        data.id = generateId();  // 新增时生成 id
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
        filteredMasters = filteredMasters.filter(m => m.cabinet === cabinetId);
    }

    const tbody = document.getElementById('master-table-body');
    tbody.innerHTML = '';

    filteredMasters.forEach(master => {
        const cabinet = currentData.cabinets.find(c => c.id === master.cabinet);
        const cabinetName = cabinet ? `${cabinet.code} - ${cabinet.name}` : '未知机柜';
        const slaveCount = currentData.slaves.filter(s => s.master === master.id).length;
        const moduleCount = currentData.modules.filter(m => m.master === master.id).length;

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
                <button class="btn btn-sm" style="background: #f6ffed;" onclick="deployMasterConfig('${master.id}')">
                    <i class="fas fa-download"></i> 配置
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
        option.selected = cabinet.id === master.cabinet;
        cabinetSelect.appendChild(option);
    });
    new bootstrap.Modal(document.getElementById('masterModal')).show();
}

async function saveMaster() {
    const id = document.getElementById('master-id').value;
    const cabinet = document.getElementById('master-cabinet').value;  // 字段名改为 cabinet（对应后端）
    const code = document.getElementById('master-code').value.trim();
    const name = document.getElementById('master-name').value.trim();
    const ip = document.getElementById('master-ip').value.trim();
    const port = document.getElementById('master-port').value.trim();
    const description = document.getElementById('master-description').value.trim();

    if (!cabinet || !code || !name || !ip || !port) {
        alert('所有带*的字段都不能为空！');
        return;
    }
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
        alert('IP地址格式不正确！');
        return;
    }

    const data = { cabinet, code, name, ip, port: parseInt(port), description };  // 字段名 cabinet
    if (id) {
        data.id = id;  // 编辑时，将 id 放入 data
    } else {
        data.id = generateId();  // 新增时生成 id
    }

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
        const filteredMasters = currentData.masters.filter(m => m.cabinet === cabinetId);
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
        filteredSlaves = filteredSlaves.filter(s => s.cabinet === cabinetId);
    }
    if (masterId) {
        filteredSlaves = filteredSlaves.filter(s => s.master === masterId);
    }

    const tbody = document.getElementById('slave-table-body');
    tbody.innerHTML = '';

    filteredSlaves.forEach(slave => {
        const cabinet = currentData.cabinets.find(c => c.id === slave.cabinet);
        const master = currentData.masters.find(m => m.id === slave.master);
        const cabinetName = cabinet ? `${cabinet.code} - ${cabinet.name}` : '未知机柜';
        const masterName = master ? `${master.code} - ${master.name}` : '未知主站';
        const moduleCount = currentData.modules.filter(m => m.slave === slave.id).length;

        // 原协议列改为显示从站类型
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${slave.code}</strong></td>
            <td>${slave.name}</td>
            <td>${cabinetName}</td>
            <td>${masterName}</td>
            <td>${slave.slave_type || 'S1-EC20'}</td>  <!-- 新增从站类型列 -->
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
    // 默认选中 S1-EC20（虽然只有一个选项）
    document.getElementById('slave-type').value = 'S1-EC20';

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
    document.getElementById('slave-description').value = slave.description || '';
    document.getElementById('slave-type').value = slave.slave_type || 'S1-EC20';  // 回填

    const cabinetSelect = document.getElementById('slave-cabinet');
    cabinetSelect.innerHTML = '<option value="">请选择机柜</option>';
    currentData.cabinets.forEach(cabinet => {
        const option = document.createElement('option');
        option.value = cabinet.id;
        option.textContent = `${cabinet.code} - ${cabinet.name}`;
        option.selected = cabinet.id === slave.cabinet;
        cabinetSelect.appendChild(option);
    });

    updateMasterSelect();
    setTimeout(() => {
        document.getElementById('slave-master').value = slave.master;
    }, 100);

    new bootstrap.Modal(document.getElementById('slaveModal')).show();
}

async function saveSlave() {
    const id = document.getElementById('slave-id').value;
    const cabinet = document.getElementById('slave-cabinet').value;
    const master = document.getElementById('slave-master').value;
    const code = document.getElementById('slave-code').value.trim();
    const name = document.getElementById('slave-name').value.trim();
    const slave_type = document.getElementById('slave-type').value; // 新增
    const description = document.getElementById('slave-description').value.trim();

    if (!cabinet || !master || !code || !name || !slave_type) {
        alert('所有带*的字段都不能为空！');
        return;
    }

    const data = {
        cabinet,
        master,
        code,
        name,
        slave_type,  // 新增
        description
    };
    if (!id) {
        data.id = generateId();
    } else {
        data.id = id;
    }

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
        const filteredMasters = currentData.masters.filter(m => m.cabinet === cabinetId);
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
        const filteredSlaves = currentData.slaves.filter(s => s.master === masterId);
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
    if (cabinetId) filteredModules = filteredModules.filter(m => m.cabinet === cabinetId);
    if (masterId) filteredModules = filteredModules.filter(m => m.master === masterId);
    if (slaveId) filteredModules = filteredModules.filter(m => m.slave === slaveId);

    const tbody = document.getElementById('module-table-body');
    tbody.innerHTML = '';

    filteredModules.forEach(module => {
        const cabinet = currentData.cabinets.find(c => c.id === module.cabinet);
        const master = currentData.masters.find(m => m.id === module.master);
        const slave = currentData.slaves.find(s => s.id === module.slave);
        const cabinetName = cabinet ? `${cabinet.code} - ${cabinet.name}` : '未知机柜';
        const masterName = master ? `${master.code} - ${master.name}` : '未知主站';
        const slaveName = slave ? `${slave.code} - ${slave.name}` : '未知从站';
        const typeNames = {
            '16DI': '16DI',
            '16DO': '16DO',
            '08AI': '08AI',
            '08AO': '08AO',
        };

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${module.code}</strong></td>
            <td>${module.name}</td>
            <td>${cabinetName}</td>
            <td>${masterName}</td>
            <td>${slaveName}</td>
            <td>${module.slot || '-'}</td>
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
    document.getElementById('module-config-container').innerHTML = '';

    document.getElementById('module-slot').value = '1';

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

    const typeSelect = document.getElementById('module-type');
    typeSelect.value = '';
    onModuleTypeChange();

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
    document.getElementById('module-slot').value = module.slot || 1;
    document.getElementById('module-description').value = module.description || '';

    // 填充机柜下拉框
    const cabinetSelect = document.getElementById('module-cabinet');
    cabinetSelect.innerHTML = '<option value="">请选择机柜</option>';
    currentData.cabinets.forEach(cabinet => {
        const option = document.createElement('option');
        option.value = cabinet.id;
        option.textContent = `${cabinet.code} - ${cabinet.name}`;
        option.selected = cabinet.id === module.cabinet;
        cabinetSelect.appendChild(option);
    });

    // 更新主站和从站下拉框
    updateModuleMasterSelect();
    setTimeout(() => {
        document.getElementById('module-master').value = module.master || '';
        updateModuleSlaveSelect();
        setTimeout(() => {
            document.getElementById('module-slave').value = module.slave || '';
        }, 100);
    }, 100);

    // 根据类型生成UI
    onModuleTypeChange();

    // 回填参数（需要等待UI生成完成）
    setTimeout(() => {
        if (module.parameters && module.parameters.length > 0) {
            const params = module.parameters;
            const type = module.type;
            if (type === '16DI') {
                const p = params[0];
                document.getElementById('di-filter').value = p.filter;
                document.getElementById('di-initial').value = `${p.invertByte1},${p.invertByte2}`;
            } else if (type === '16DO') {
                const p = params[0];
                document.getElementById('do-enable-preset').checked = p.enableOutputPresetValue === 1;
                document.getElementById('do-initial').value = `${p.presentByte1},${p.presentByte2}`;
            } else if (type === '08AI' && params.length === 8) {
                for (let i = 0; i < 8; i++) {
                    const p = params[i];
                    const modeSelect = document.getElementById(`ai-mode-${i}`);
                    const diffSelect = document.getElementById(`ai-diff-${i}`);
                    const filterSelect = document.getElementById(`ai-filter-${i}`);
                    if (modeSelect) modeSelect.value = p.mode;
                    if (diffSelect) diffSelect.value = p.singleOrDifferential;
                    if (filterSelect) filterSelect.value = p.filter;
                }
            } else if (type === '08AO' && params.length === 8) {
                for (let i = 0; i < 8; i++) {
                    const p = params[i];
                    const modeSelect = document.getElementById(`ao-mode-${i}`);
                    const rangeSelect = document.getElementById(`ao-range-${i}`);
                    const currentSelect = document.getElementById(`ao-current-${i}`);
                    if (modeSelect) modeSelect.value = p.mode;
                    if (rangeSelect) rangeSelect.value = p.range;
                    if (currentSelect) currentSelect.value = p.current;
                }
            }
        }
    }, 200); // 给UI渲染留出时间

    new bootstrap.Modal(document.getElementById('moduleModal')).show();
}

async function saveModule() {
    const id = document.getElementById('module-id').value;
    const cabinet = document.getElementById('module-cabinet').value;
    const master = document.getElementById('module-master').value;
    const slave = document.getElementById('module-slave').value;
    const code = document.getElementById('module-code').value.trim();
    const name = document.getElementById('module-name').value.trim();
    const type = document.getElementById('module-type').value;
    const slot = parseInt(document.getElementById('module-slot').value, 10);
    const description = document.getElementById('module-description').value.trim();

    if (!cabinet || !master || !slave || !code || !name || !type || !slot) {
        alert('所有带*的字段都不能为空！');
        return;
    }

    // 通道数
    let channels = 0;
    if (type === '16DI' || type === '16DO') channels = 16;
    else if (type === '08AI' || type === '08AO') channels = 8;

    // 收集参数
    let parameters = [];

    if (type === '16DI') {
        const filter = parseFloat(document.getElementById('di-filter').value);
        const initialStr = document.getElementById('di-initial').value.trim();
        let invertByte1 = 0, invertByte2 = 0;
        if (initialStr) {
            const parts = initialStr.split(',').map(s => parseInt(s.trim(), 10));
            invertByte1 = parts[0] || 0;
            invertByte2 = parts[1] || 0;
        }
        parameters = [{ filter, invertByte1, invertByte2 }];
    } else if (type === '16DO') {
        const enable = document.getElementById('do-enable-preset').checked ? 1 : 0;
        const initialStr = document.getElementById('do-initial').value.trim();
        let presentByte1 = 0, presentByte2 = 0;
        if (initialStr) {
            const parts = initialStr.split(',').map(s => parseInt(s.trim(), 10));
            presentByte1 = parts[0] || 0;
            presentByte2 = parts[1] || 0;
        }
        parameters = [{ enableOutputPresetValue: enable, presentByte1, presentByte2 }];
    } else if (type === '08AI') {
        for (let i = 0; i < 8; i++) {
            const mode = parseInt(document.getElementById(`ai-mode-${i}`).value, 10);
            const diff = parseInt(document.getElementById(`ai-diff-${i}`).value, 10);
            const filter = parseInt(document.getElementById(`ai-filter-${i}`).value, 10);
            parameters.push({ mode, singleOrDifferential: diff, filter });
        }
    } else if (type === '08AO') {
        for (let i = 0; i < 8; i++) {
            const mode = parseInt(document.getElementById(`ao-mode-${i}`).value, 10);
            const range = parseInt(document.getElementById(`ao-range-${i}`).value, 10);
            const current = parseInt(document.getElementById(`ao-current-${i}`).value, 10);
            parameters.push({ mode, range, current });
        }
    }

    console.log('Parameters collected:', parameters);

    const data = {
        cabinet,
        master,
        slave,
        code,
        name,
        type,
        slot,
        channels,
        description,
        parameters  // 直接传递数组
    };
    if (!id) {
        data.id = generateId();
    } else {
        data.id = id;
    }

    console.log('Full data to send:', JSON.stringify(data, null, 2));

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
        const filteredMasters = currentData.masters.filter(m => m.cabinet === cabinetId);
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
        const filteredSlaves = currentData.slaves.filter(s => s.master === masterId);
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
        const filteredModules = currentData.modules.filter(m => m.slave === slaveId);
        filteredModules.forEach(module => {
            const option = document.createElement('option');
            option.value = module.id;
            option.textContent = `${module.code} - ${module.name}`;
            moduleSelect.appendChild(option);
        });
    }
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
        option.selected = cabinet.id === signal.cabinet;
        cabinetSelect.appendChild(option);
    });

    updateSignalMasterSelect();
    setTimeout(() => {
        document.getElementById('signal-master').value = signal.master;
        updateSignalSlaveSelect();
        setTimeout(() => {
            document.getElementById('signal-slave').value = signal.slave;
            updateSignalModuleSelect();
            setTimeout(() => {
                document.getElementById('signal-module').value = signal.module;
            }, 100);
        }, 100);
    }, 100);
    new bootstrap.Modal(document.getElementById('signalModal')).show();
}

async function saveSignal() {
    const id = document.getElementById('signal-id').value;
    const cabinet = document.getElementById('signal-cabinet').value;
    const master = document.getElementById('signal-master').value;
    const slave = document.getElementById('signal-slave').value;
    const module = document.getElementById('signal-module').value;
    const code = document.getElementById('signal-code').value.trim();
    const name = document.getElementById('signal-name').value.trim();
    const type = document.getElementById('signal-type').value;
    const channel = document.getElementById('signal-channel').value.trim();
    const unit = document.getElementById('signal-unit').value.trim();
    const rangeMin = document.getElementById('signal-range-min').value.trim();
    const rangeMax = document.getElementById('signal-range-max').value.trim();
    const description = document.getElementById('signal-description').value.trim();

    if (!cabinet || !master || !slave || !module || !code || !name || !type || !channel) {
        alert('所有带*的字段都不能为空！');
        return;
    }

    const data = {
        cabinet, master, slave, module,
        code, name, type,
        channel: parseInt(channel),
        unit: unit || null,
        rangeMin: rangeMin ? parseFloat(rangeMin) : null,
        rangeMax: rangeMax ? parseFloat(rangeMax) : null,
        description
    };
    if (id) {
        data.id = id;  // 编辑时，将 id 放入 data
    } else {
        data.id = generateId();  // 新增时生成 id
    }

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


// ==================== 工程管理 ====================

// 刷新工程列表
function refreshProjectView() {
    const searchTerm = document.getElementById('project-search').value.toLowerCase();
    const filteredProjects = searchTerm
        ? currentData.projects.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            (p.description && p.description.toLowerCase().includes(searchTerm))
        )
        : currentData.projects;

    const tbody = document.getElementById('project-table-body');
    tbody.innerHTML = '';

    filteredProjects.forEach(project => {
        const signalCount = project.signals ? project.signals.length : 0;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${project.name}</strong></td>
            <td>${project.description || '-'}</td>
            <td><span class="badge badge-info">${signalCount}</span></td>
            <td>${project.created_at || project.create_time || '-'}</td>
            <td class="action-buttons">
                <button class="btn btn-sm" style="background: #e6f7ff;" onclick="startProject('${project.id}')">
                    <i class="fas fa-play"></i> 启动
                </button>
                <button class="btn btn-sm" style="background: #f6ffed;" onclick="viewProject('${project.id}')">
                    <i class="fas fa-eye"></i> 查看
                </button>
                <button class="btn btn-sm" style="background: #fff2e8;" onclick="editProject('${project.id}')">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="btn btn-sm" style="background: #fff1f0;" onclick="confirmDeleteItem('project', '${project.id}', '${project.name}')">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('project-count').textContent = `共 ${filteredProjects.length} 个工程`;
}

function searchProjects() {
    refreshProjectView();
}

// 显示新建工程模态框
function showAddProjectModal() {
    document.getElementById('projectModalTitle').textContent = '新建工程';
    document.getElementById('project-id').value = '';
    document.getElementById('project-name').value = '';
    document.getElementById('project-description').value = '';

    // 生成信号复选框列表
    const container = document.getElementById('signal-checkbox-list');
    container.innerHTML = '';
    currentData.signals.forEach(signal => {
        const div = document.createElement('div');
        div.className = 'form-check';
        div.innerHTML = `
            <input class="form-check-input" type="checkbox" value="${signal.id}" id="signal-${signal.id}">
            <label class="form-check-label" for="signal-${signal.id}">
                ${signal.code} - ${signal.name} (${signal.type})
            </label>
        `;
        container.appendChild(div);
    });

    new bootstrap.Modal(document.getElementById('projectModal')).show();
}

// 编辑工程
function editProject(id) {
    const project = currentData.projects.find(p => p.id === id);
    if (!project) return;

    document.getElementById('projectModalTitle').textContent = '编辑工程';
    document.getElementById('project-id').value = project.id;
    document.getElementById('project-name').value = project.name;
    document.getElementById('project-description').value = project.description || '';

    // 生成信号复选框，并勾选已选中的
    const container = document.getElementById('signal-checkbox-list');
    container.innerHTML = '';
    currentData.signals.forEach(signal => {
        const div = document.createElement('div');
        div.className = 'form-check';
        const checked = project.signals && project.signals.includes(signal.id) ? 'checked' : '';
        div.innerHTML = `
            <input class="form-check-input" type="checkbox" value="${signal.id}" id="signal-${signal.id}" ${checked}>
            <label class="form-check-label" for="signal-${signal.id}">
                ${signal.code} - ${signal.name} (${signal.type})
            </label>
        `;
        container.appendChild(div);
    });

    new bootstrap.Modal(document.getElementById('projectModal')).show();
}

// 保存工程
async function saveProject() {
    const id = document.getElementById('project-id').value;
    const name = document.getElementById('project-name').value.trim();
    const description = document.getElementById('project-description').value.trim();

    if (!name) {
        alert('工程名称不能为空！');
        return;
    }

    // 获取选中的信号 ID
    const selectedSignals = [];
    document.querySelectorAll('#signal-checkbox-list input:checked').forEach(cb => {
        selectedSignals.push(cb.value);
    });

    const data = {
        name,
        description,
        signals: selectedSignals
    };
    if (id) {
        data.id = id;  // 编辑时，将 id 放入 data
    } else {
        data.id = generateId();  // 新增时生成 id
    }

    try {
        if (id) {
            await apiRequest(`${API_BASE}/projects/${id}/`, 'PUT', data);
        } else {
            await apiRequest(`${API_BASE}/projects/`, 'POST', data);
        }
        await loadAllData();
        bootstrap.Modal.getInstance(document.getElementById('projectModal')).hide();
    } catch (error) {
        console.error('保存工程失败:', error);
        alert('保存失败，请重试');
    }
}

// 查看工程详情
function viewProject(id) {
    const project = currentData.projects.find(p => p.id === id);
    if (!project) return;

    // 获取信号详情
    const signals = project.signals.map(signalId => {
        const sig = currentData.signals.find(s => s.id === signalId);
        return sig ? `${sig.code} - ${sig.name} (${sig.type})` : '未知信号';
    }).join('<br>');

    const content = `
        <h5>${project.name}</h5>
        <p><strong>描述：</strong>${project.description || '无'}</p>
        <p><strong>包含信号：</strong></p>
        <div style="background: #f8f9fa; padding: 10px; border-radius: 4px;">
            ${signals || '无信号'}
        </div>
        <p class="mt-3"><strong>创建时间：</strong>${project.created_at || '-'}</p>
    `;

    document.getElementById('project-detail-content').innerHTML = content;
    new bootstrap.Modal(document.getElementById('projectDetailModal')).show();
}

// 启动工程
async function startProject(id) {
    const project = currentData.projects.find(p => p.id === id);
    if (!project) return;

    try {
        const response = await apiRequest(`${API_BASE}/publish-mqtt/`, 'POST', {
            project_id: id,
            action: 'start'
        });

        alert(`启动工程：${project.name}\n已发送 ${response.sent} / ${response.total} 条 MQTT 消息`);
    } catch (error) {
        console.error('启动工程失败:', error);
        alert('启动失败，请重试');
    }
}

// 在删除功能中添加对工程的级联处理（可选，但工程独立，不需要级联）
function confirmDeleteItem(type, id, name) {
    deleteInfo = { type, id, name };
    let message = `确定要删除${type} "${name}" 吗？`;
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

// ==================== 设置功能 ====================
function changePassword() {
    const newPwd = prompt('请输入新密码：');
    if (newPwd) alert('密码修改成功！');
}
function logout() {
    if (confirm('确定要注销吗？')) {
        alert('注销成功！');
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

async function deployMasterConfig(masterId) {
    try {
        const response = await apiRequest(`${API_BASE}/masters/${masterId}/deploy-config/`, 'POST');
        alert(`配置下发成功，主题：${response.topic}`);
    } catch (error) {
        console.error('下发配置失败:', error);
        alert('下发配置失败，请重试');
    }
}

function onModuleTypeChange() {
    const type = document.getElementById('module-type').value;
    const container = document.getElementById('module-config-container');
    container.innerHTML = ''; // 清空

    if (type === '16DI') {
        const div = document.createElement('div');
        div.className = 'row mb-2';
        div.innerHTML = `
            <div class="col">
                <label>滤波等级 (Enum)</label>
                <select class="form-control" id="di-filter">
                    <option value="0">0</option>
                    <option value="0.5">0.5</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                </select>
            </div>
            <div class="col">
                <label>初始值 (invertByte1,invertByte2)</label>
                <input type="text" class="form-control" id="di-initial" placeholder="例如: 0,0">
            </div>
        `;
        container.appendChild(div);
    } else if (type === '16DO') {
        const div = document.createElement('div');
        div.className = 'row mb-2';
        div.innerHTML = `
            <div class="col">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="do-enable-preset">
                    <label class="form-check-label" for="do-enable-preset">允许输出设置</label>
                </div>
            </div>
            <div class="col">
                <label>初始值 (presentByte1,presentByte2)</label>
                <input type="text" class="form-control" id="do-initial" placeholder="例如: 0,0">
            </div>
        `;
        container.appendChild(div);
    } else if (type === '08AI') {
        const table = document.createElement('table');
        table.className = 'table table-bordered';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>通道</th>
                    <th>模式 (0-20)</th>
                    <th>单端/差分</th>
                    <th>滤波等级 (0-3)</th>
                </tr>
            </thead>
            <tbody id="ai-config-rows"></tbody>
        `;
        const tbody = table.querySelector('tbody');
        for (let i = 0; i < 8; i++) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>通道 ${i+1}</td>
                <td>
                    <select class="form-control" id="ai-mode-${i}">
                        ${Array.from({length: 21}, (_, j) => `<option value="${j}">${j}</option>`).join('')}
                    </select>
                </td>
                <td>
                    <select class="form-control" id="ai-diff-${i}">
                        <option value="0">单端</option>
                        <option value="1">差分</option>
                    </select>
                </td>
                <td>
                    <select class="form-control" id="ai-filter-${i}">
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                </td>
            `;
            tbody.appendChild(row);
        }
        container.appendChild(table);
    } else if (type === '08AO') {
        const table = document.createElement('table');
        table.className = 'table table-bordered';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>通道</th>
                    <th>模式 (0-7)</th>
                    <th>范围</th>
                    <th>限流 (mA)</th>
                </tr>
            </thead>
            <tbody id="ao-config-rows"></tbody>
        `;
        const tbody = table.querySelector('tbody');
        for (let i = 0; i < 8; i++) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>通道 ${i+1}</td>
                <td>
                    <select class="form-control" id="ao-mode-${i}">
                        ${Array.from({length: 8}, (_, j) => `<option value="${j}">${j}</option>`).join('')}
                    </select>
                </td>
                <td>
                    <select class="form-control" id="ao-range-${i}">
                        <option value="0">标准模式</option>
                        <option value="1">超量程模式</option>
                    </select>
                </td>
                <td>
                    <select class="form-control" id="ao-current-${i}">
                        <option value="8">8</option>
                        <option value="16">16</option>
                        <option value="24">24</option>
                        <option value="32">32</option>
                    </select>
                </td>
            `;
            tbody.appendChild(row);
        }
        container.appendChild(table);
    }
}

// ==================== 信号管理辅助函数 ====================

// 按模块 ID 对信号数组进行分组
function groupSignalsByModule(signals) {
    const groups = {};
    signals.forEach(signal => {
        const moduleId = signal.module;
        if (!groups[moduleId]) {
            groups[moduleId] = [];
        }
        groups[moduleId].push(signal);
    });
    return groups;
}

// 渲染一个模块的所有信号为一个表格（输入信号专用，包含信号类型列）
function renderInputModuleGroup(module, signals, container) {
    const moduleTitle = document.createElement('div');
    moduleTitle.className = 'bg-success bg-opacity-10 p-2 mb-2 fw-bold';
    moduleTitle.textContent = `${module.code} - ${module.name} (${module.type})`;
    container.appendChild(moduleTitle);

    const table = document.createElement('table');
    table.className = 'table table-sm table-bordered mb-4';
    table.innerHTML = `
        <thead class="table-light">
            <tr>
                <th style="width: 40px;">选择</th>
                <th>信号编号</th>
                <th>模块类型</th>
                <th>变量名称</th>
                <th>信号类型</th>
                <th>设定数值</th>
                <th>当前数值</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    signals.sort((a, b) => a.channel - b.channel);

    signals.forEach(signal => {
        const row = document.createElement('tr');
        // 信号类型固定为 "静态信号"
        const signalTypeDisplay = '静态信号';

        // 设定数值下拉框（禁用）
        const setpointSelect = document.createElement('select');
        setpointSelect.className = 'form-control form-control-sm setpoint-input';
        setpointSelect.disabled = true;
        setpointSelect.dataset.signalId = signal.id;

        const option0 = document.createElement('option');
        option0.value = '0';
        option0.textContent = '0';
        option0.selected = (signal.setpoint === 0 || signal.setpoint === null || signal.setpoint === undefined);
        const option1 = document.createElement('option');
        option1.value = '1';
        option1.textContent = '1';
        option1.selected = (signal.setpoint === 1);

        setpointSelect.appendChild(option0);
        setpointSelect.appendChild(option1);

        row.innerHTML = `
            <td style="text-align: center;">
                <input type="checkbox" class="signal-checkbox" data-signal-id="${signal.id}">
            </td>
            <td>${signal.code}</td>
            <td>${signal.type}</td>
            <td>${signal.name}</td>
            <td>${signalTypeDisplay}</td>
            <td></td>
            <td>${signal.current_value !== null && signal.current_value !== undefined ? signal.current_value : '-'}</td>
        `;
        const setpointTd = row.cells[5];
        setpointTd.appendChild(setpointSelect);

        tbody.appendChild(row);
    });

    container.appendChild(table);
}

function renderOutputModuleGroup(module, signals, container) {
    const moduleTitle = document.createElement('div');
    moduleTitle.className = 'bg-success bg-opacity-10 p-2 mb-2 fw-bold';
    moduleTitle.textContent = `${module.code} - ${module.name} (${module.type})`;
    container.appendChild(moduleTitle);

    const table = document.createElement('table');
    table.className = 'table table-sm table-bordered mb-4';
    table.innerHTML = `
        <thead class="table-light">
            <tr>
                <th style="width: 40px;">选择</th>
                <th>信号编号</th>
                <th>模块类型</th>
                <th>变量名称</th>
                <th>信号类型</th>
                <th style="width: 150px;">设定数值</th>
                <th>当前数值</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    signals.sort((a, b) => a.channel - b.channel);

    signals.forEach(signal => {
        const row = document.createElement('tr');

        // 信号类型下拉框
        const waveTypeSelect = document.createElement('select');
        waveTypeSelect.className = 'form-control form-control-sm wave-type-input';
        waveTypeSelect.dataset.signalId = signal.id;

        const typeOptions = [
            { value: 1, text: '静态信号' },
            { value: 2, text: '方波' },
            { value: 3, text: '正弦波' },
            { value: 4, text: '三角波' }
        ];
        typeOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            option.selected = (signal.wave_type === opt.value);
            waveTypeSelect.appendChild(option);
        });

        // 设定数值控件（根据模块类型和信号类型动态变化）
        let setpointControl;
        if (module.type === '08AO') {
            // AO模块：始终为数字输入框
            setpointControl = document.createElement('input');
            setpointControl.type = 'number';
            setpointControl.className = 'form-control form-control-sm setpoint-input';
            setpointControl.step = 'any';
            setpointControl.value = signal.setpoint !== null && signal.setpoint !== undefined ? signal.setpoint : 0;
        } else { // 16DO模块
            const isStatic = (signal.wave_type === 1);
            if (isStatic) {
                // 静态信号：下拉框 0/1
                setpointControl = document.createElement('select');
                setpointControl.className = 'form-control form-control-sm setpoint-input';
                const option0 = document.createElement('option');
                option0.value = '0';
                option0.textContent = '0';
                option0.selected = (signal.setpoint === 0 || signal.setpoint === null || signal.setpoint === undefined);
                const option1 = document.createElement('option');
                option1.value = '1';
                option1.textContent = '1';
                option1.selected = (signal.setpoint === 1);
                setpointControl.appendChild(option0);
                setpointControl.appendChild(option1);
            } else {
                // 非静态信号：数字输入框
                setpointControl = document.createElement('input');
                setpointControl.type = 'number';
                setpointControl.className = 'form-control form-control-sm setpoint-input';
                setpointControl.step = 'any';
                setpointControl.value = signal.setpoint !== null && signal.setpoint !== undefined ? signal.setpoint : 0;
            }
        }
        setpointControl.dataset.signalId = signal.id;

        row.innerHTML = `
            <td style="text-align: center;">
                <input type="checkbox" class="signal-checkbox" data-signal-id="${signal.id}">
            </td>
            <td>${signal.code}</td>
            <td>${signal.type}</td>
            <td>${signal.name}</td>
            <td></td>
            <td></td>
            <td>${signal.current_value !== null && signal.current_value !== undefined ? signal.current_value : '-'}</td>
        `;

        // 将信号类型下拉框放入第5列
        const waveTypeTd = row.cells[4];
        waveTypeTd.appendChild(waveTypeSelect);

        // 将设定数值控件放入第6列
        const setpointTd = row.cells[5];
        setpointTd.appendChild(setpointControl);

        tbody.appendChild(row);
    });

    container.appendChild(table);
}

// ==================== 信号管理主函数 ====================
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
    if (cabinetId) filteredSignals = filteredSignals.filter(s => s.cabinet === cabinetId);
    if (masterId) filteredSignals = filteredSignals.filter(s => s.master === masterId);
    if (slaveId) filteredSignals = filteredSignals.filter(s => s.slave === slaveId);
    if (moduleId) filteredSignals = filteredSignals.filter(s => s.module === moduleId);

    // 定义输入/输出模块类型
    const inputTypes = ['16DI', '08AI'];
    const outputTypes = ['16DO', '08AO'];

    const inputSignals = filteredSignals.filter(s => inputTypes.includes(s.type));
    const outputSignals = filteredSignals.filter(s => outputTypes.includes(s.type));

    // 按模块分组
    const inputGroups = groupSignalsByModule(inputSignals);
    const outputGroups = groupSignalsByModule(outputSignals);

    // 渲染输入信号
    const inputContainer = document.getElementById('input-signals-container');
    inputContainer.innerHTML = '';
    for (const [modId, sigs] of Object.entries(inputGroups)) {
        const module = currentData.modules.find(m => m.id === modId);
        if (module) renderInputModuleGroup(module, sigs, inputContainer);
    }
    if (Object.keys(inputGroups).length === 0) {
        inputContainer.innerHTML = '<p class="text-muted">暂无输入信号</p>';
    }

    // 渲染输出信号
    const outputContainer = document.getElementById('output-signals-container');
    outputContainer.innerHTML = '';
    for (const [modId, sigs] of Object.entries(outputGroups)) {
        const module = currentData.modules.find(m => m.id === modId);
        if (module) renderOutputModuleGroup(module, sigs, outputContainer);
    }
    if (Object.keys(outputGroups).length === 0) {
        outputContainer.innerHTML = '<p class="text-muted">暂无输出信号</p>';
    }

    // 绑定设定数值输入框的 change 事件
    document.querySelectorAll('.setpoint-input').forEach(input => {
        input.addEventListener('change', async function() {
            const signalId = this.dataset.signalId;
            const value = this.value === '' ? null : parseFloat(this.value);
            try {
                await apiRequest(`${API_BASE}/signals/${signalId}/`, 'PATCH', { setpoint: value });
                // 更新内存数据
                const signal = currentData.signals.find(s => s.id === signalId);
                if (signal) signal.setpoint = value;
            } catch (error) {
                console.error('更新设定值失败:', error);
                alert('设定值保存失败');
            }
        });
    });

    // 绑定全选事件
    const selectAllInput = document.getElementById('select-all-input');
    if (selectAllInput) {
        selectAllInput.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('#input-signals-container .signal-checkbox');
            checkboxes.forEach(cb => cb.checked = this.checked);
        });
    }

    const selectAllOutput = document.getElementById('select-all-output');
    if (selectAllOutput) {
        selectAllOutput.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('#output-signals-container .signal-checkbox');
            checkboxes.forEach(cb => cb.checked = this.checked);
        });
    }

    // 绑定信号类型下拉框 change 事件
    document.querySelectorAll('.wave-type-input').forEach(select => {
        select.addEventListener('change', async function() {
            const signalId = this.dataset.signalId;
            const waveType = parseInt(this.value, 10);
            await updateSignalWaveType(signalId, waveType);
            // 更新后可能需要刷新当前行的设定数值控件（如果是DO模块）
            // 简单起见，重新加载整个信号视图
            // 但为避免闪烁，可以仅更新当前行的设定数值控件
            // 这里为了简化，直接重新加载
            refreshSignalView();
        });
    });

    // 恢复之前选中的 checkbox
    const savedSelectedIds = window._savedSignalIds || [];
    if (savedSelectedIds.length > 0) {
        setTimeout(() => {
            savedSelectedIds.forEach(id => {
                const checkbox = document.querySelector(`.signal-checkbox[data-signal-id="${id}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }, 0);
    }
    window._savedSignalIds = [];
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
    document.getElementById('signal-module-filter').value = '';
    refreshSignalView();
}

async function runSelectedSignals() {
    const selectedIds = Array.from(document.querySelectorAll('.signal-checkbox:checked'))
        .map(cb => cb.dataset.signalId);
    if (selectedIds.length === 0) {
        alert('请先选择要执行的信号！');
        return;
    }
    try {
        const response = await apiRequest(`${API_BASE}/execute-signals/`, 'POST', { signal_ids: selectedIds });
        let message = '执行完成：\n';
        response.results.forEach(r => {
            message += `主站 ${r.master}: ${r.success ? '成功' : '失败'}\n`;
        });
        alert(message);
    } catch (error) {
        console.error('执行失败:', error);
        alert('执行失败，请重试');
    }
}

async function updateSignalWaveType(signalId, waveType) {
    try {
        await apiRequest(`${API_BASE}/signals/${signalId}/`, 'PATCH', { wave_type: waveType });
        const signal = currentData.signals.find(s => s.id === signalId);
        if (signal) signal.wave_type = waveType;
    } catch (error) {
        console.error('更新信号类型失败:', error);
        alert('信号类型保存失败');
    }
}

// 信号管理定时刷新相关
let signalRefreshTimer = null;

function startSignalRefresh() {
    if (signalRefreshTimer) clearInterval(signalRefreshTimer);
    signalRefreshTimer = setInterval(reloadSignals, 1000);
}

function stopSignalRefresh() {
    if (signalRefreshTimer) {
        clearInterval(signalRefreshTimer);
        signalRefreshTimer = null;
    }
}

async function reloadSignals() {
    // 仅在信号管理模块激活时执行
    if (!document.getElementById('signal-management').classList.contains('active')) {
        return;
    }
    // 如果当前不是输入信号标签页，则不刷新
    const inputTab = document.getElementById('input-signals');
    if (!inputTab || !inputTab.classList.contains('active')) {
        return;
    }
    // 保存当前选中的信号 ID
    const selectedIds = Array.from(document.querySelectorAll('.signal-checkbox:checked'))
        .map(cb => cb.dataset.signalId);
    window._savedSignalIds = selectedIds;

    try {
        const signals = await apiRequest(`${API_BASE}/signals/`);
        currentData.signals = signals;
        refreshSignalView(); // 重新渲染表格，内部会恢复选中状态
    } catch (error) {
        console.error('刷新信号数据失败:', error);
        window._savedSignalIds = [];
    }
}