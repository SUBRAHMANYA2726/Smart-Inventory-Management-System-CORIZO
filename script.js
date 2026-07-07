const apiUrl = window.location.protocol === 'file:'
    ? 'http://127.0.0.1:5000/api/items'
    : '/api/items';
const pageSize = 8;

const $ = (selector) => document.querySelector(selector);

const state = {
    items: [],
    filtered: [],
    page: 1,
    sort: 'updated_at-desc',
    deleteId: null,
    charts: {},
};

const fields = {
    form: $('#itemForm'),
    id: $('#itemId'),
    image: $('#imageData'),
    name: $('#itemName'),
    description: $('#description'),
    quantity: $('#quantity'),
    price: $('#price'),
    category: $('#category'),
    supplier: $('#supplier'),
    sku: $('#sku'),
    barcode: $('#barcode'),
    purchaseDate: $('#purchaseDate'),
    expiryDate: $('#expiryDate'),
    minStock: $('#minStock'),
    status: $('#status'),
};

const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

const shortDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

function normalizeItem(item) {
    return {
        id: item.id,
        name: item.name || '',
        desc: item.desc || '',
        qty: Number(item.qty || 0),
        price: Number(item.price || 0),
        category: item.category || 'General',
        supplier: item.supplier || '',
        sku: item.sku || '',
        barcode: item.barcode || '',
        purchase_date: item.purchase_date || '',
        expiry_date: item.expiry_date || '',
        min_stock: Number(item.min_stock ?? 5),
        status: item.status || 'Active',
        image: item.image || '',
        created_at: item.created_at || '',
        updated_at: item.updated_at || '',
    };
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatDate(value) {
    if (!value) {
        return 'Not set';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : shortDate.format(date);
}

function isToday(value) {
    if (!value) {
        return false;
    }
    const date = new Date(value);
    const now = new Date();
    return date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate();
}

function showLoading(isLoading) {
    $('#loadingOverlay').classList.toggle('hidden', !isLoading);
}

function toast(message, type = 'success') {
    const toastEl = document.createElement('div');
    toastEl.className = `toast ${type}`;
    toastEl.innerHTML = `
        <i data-lucide="${type === 'error' ? 'circle-alert' : 'circle-check'}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    $('#toastStack').appendChild(toastEl);
    refreshIcons();
    window.setTimeout(() => toastEl.remove(), 3800);
}

function refreshIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function formPayload() {
    return {
        name: fields.name.value.trim(),
        description: fields.description.value.trim(),
        quantity: Number(fields.quantity.value),
        price: Number(fields.price.value),
        category: fields.category.value.trim() || 'General',
        supplier: fields.supplier.value.trim(),
        sku: fields.sku.value.trim(),
        barcode: fields.barcode.value.trim(),
        purchase_date: fields.purchaseDate.value,
        expiry_date: fields.expiryDate.value,
        min_stock: Number(fields.minStock.value || 5),
        status: fields.status.value,
        image: fields.image.value,
    };
}

function resetForm() {
    fields.form.reset();
    fields.id.value = '';
    fields.image.value = '';
    $('#imagePreview').innerHTML = '<i data-lucide="image-plus"></i>';
    $('#formTitle').textContent = 'Add Product';
    $('#submitButton').innerHTML = '<i data-lucide="save"></i> Add Product';
    $('#resetButton').classList.add('hidden');
    refreshIcons();
}

function updateCategoryControls() {
    const categories = [...new Set(state.items.map((item) => item.category).filter(Boolean))].sort();
    const filter = $('#categoryFilter');
    const selected = filter.value;
    filter.innerHTML = '<option value="">All Categories</option>';
    $('#categoryOptions').innerHTML = '';

    categories.forEach((category) => {
        filter.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`);
        $('#categoryOptions').insertAdjacentHTML('beforeend', `<option value="${escapeHtml(category)}"></option>`);
    });

    filter.value = categories.includes(selected) ? selected : '';
    $('#totalCategories').textContent = `${categories.length} categories`;
    const categoryCount = $('#categoryCount');
    if (categoryCount) {
        categoryCount.textContent = categories.length;
    }
}

function updateStats() {
    const totalUnits = state.items.reduce((sum, item) => sum + item.qty, 0);
    const totalValue = state.items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const lowStock = state.items.filter((item) => item.qty <= item.min_stock || item.status === 'Low Stock').length;
    const todayUpdates = state.items.filter((item) => isToday(item.updated_at) || isToday(item.created_at)).length;

    $('#totalItems').textContent = state.items.length;
    $('#totalQuantity').textContent = `${totalUnits} units`;
    $('#totalValue').textContent = currency.format(totalValue);
    $('#lowStock').textContent = lowStock;
    $('#todayUpdates').textContent = todayUpdates;
}

function applyFilters() {
    const query = $('#searchInput').value.trim().toLowerCase();
    const category = $('#categoryFilter').value;
    const [sortKey, direction] = state.sort.split('-');

    state.filtered = state.items.filter((item) => {
        const haystack = [item.name, item.desc, item.category, item.supplier, item.sku, item.barcode, item.status]
            .join(' ')
            .toLowerCase();
        return (!query || haystack.includes(query)) && (!category || item.category === category);
    });

    state.filtered.sort((a, b) => {
        const aValue = a[sortKey] ?? '';
        const bValue = b[sortKey] ?? '';
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return direction === 'asc'
            ? String(aValue).localeCompare(String(bValue))
            : String(bValue).localeCompare(String(aValue));
    });

    const totalPages = Math.max(1, Math.ceil(state.filtered.length / pageSize));
    state.page = Math.min(state.page, totalPages);
}

function renderTable() {
    applyFilters();
    const start = (state.page - 1) * pageSize;
    const pageItems = state.filtered.slice(start, start + pageSize);
    const tableBody = $('#itemsTableBody');
    tableBody.innerHTML = '';
    $('#emptyState').classList.toggle('hidden', state.filtered.length > 0);

    pageItems.forEach((item, index) => {
        const image = item.image
            ? `<img src="${item.image}" alt="${escapeHtml(item.name)}">`
            : `<span>${escapeHtml(item.name.charAt(0) || 'I')}</span>`;
        const statusClass = item.status.toLowerCase().replaceAll(' ', '-');
        const stockClass = item.qty <= item.min_stock ? 'low' : 'healthy';

        tableBody.insertAdjacentHTML('beforeend', `
            <tr style="animation-delay: ${index * 40}ms">
                <td>
                    <div class="product-cell">
                        <div class="product-thumb">${image}</div>
                        <div>
                            <strong>${escapeHtml(item.name)}</strong>
                            <small>${escapeHtml(item.sku || 'No SKU')} ${item.barcode ? ' / ' + escapeHtml(item.barcode) : ''}</small>
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(item.category)}</td>
                <td><span class="stock-pill ${stockClass}">${item.qty} / min ${item.min_stock}</span></td>
                <td>${currency.format(item.price)}</td>
                <td>${escapeHtml(item.supplier || 'Not assigned')}</td>
                <td><span class="status-badge ${statusClass}">${escapeHtml(item.status)}</span></td>
                <td>${formatDate(item.updated_at)}</td>
                <td>
                    <div class="actions">
                        <button type="button" class="icon-button edit-button" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.name)}"><i data-lucide="pencil"></i></button>
                        <button type="button" class="icon-button delete-button" data-id="${item.id}" aria-label="Delete ${escapeHtml(item.name)}"><i data-lucide="trash-2"></i></button>
                    </div>
                </td>
            </tr>
        `);
    });

    const totalPages = Math.max(1, Math.ceil(state.filtered.length / pageSize));
    $('#pageInfo').textContent = `Showing ${pageItems.length} of ${state.filtered.length} products`;
    $('#pageNumber').textContent = `${state.page} / ${totalPages}`;
    $('#prevPage').disabled = state.page <= 1;
    $('#nextPage').disabled = state.page >= totalPages;
    refreshIcons();
}

function renderActivity() {
    const activities = JSON.parse(localStorage.getItem('inventoryActivities') || '[]');
    const recent = activities.slice(0, 6);
    $('#activityList').innerHTML = recent.length
        ? recent.map((activity) => `
            <div class="activity-item">
                <span><i data-lucide="${activity.icon}"></i></span>
                <div>
                    <strong>${escapeHtml(activity.title)}</strong>
                    <small>${escapeHtml(activity.time)}</small>
                </div>
            </div>
        `).join('')
        : '<p class="muted">No activity yet. Create your first product to start the log.</p>';

    const top = [...state.items]
        .sort((a, b) => (b.qty * b.price) - (a.qty * a.price))
        .slice(0, 4);

    $('#topProducts').innerHTML = top.length
        ? top.map((item, index) => `
            <div class="top-product">
                <span>${index + 1}</span>
                <strong>${escapeHtml(item.name)}</strong>
                <small>${currency.format(item.qty * item.price)}</small>
            </div>
        `).join('')
        : '<p class="muted">Top products appear after inventory is added.</p>';
}

function logActivity(title, icon = 'activity') {
    const activities = JSON.parse(localStorage.getItem('inventoryActivities') || '[]');
    activities.unshift({
        title,
        icon,
        time: new Date().toLocaleString(),
    });
    localStorage.setItem('inventoryActivities', JSON.stringify(activities.slice(0, 20)));
    renderActivity();
}

function chartOptions() {
    const textColor = getComputedStyle(document.body).getPropertyValue('--muted').trim();
    const gridColor = getComputedStyle(document.body).getPropertyValue('--chart-grid').trim();
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: textColor } },
        },
        scales: {
            x: { ticks: { color: textColor }, grid: { color: gridColor } },
            y: { ticks: { color: textColor }, grid: { color: gridColor } },
        },
    };
}

function renderCharts() {
    if (!window.Chart) {
        return;
    }

    Object.values(state.charts).forEach((chart) => chart.destroy());

    const topValueItems = [...state.items]
        .sort((a, b) => (b.qty * b.price) - (a.qty * a.price))
        .slice(0, 7);
    const categories = {};
    const monthly = {};

    state.items.forEach((item) => {
        categories[item.category] = (categories[item.category] || 0) + 1;
        const month = item.updated_at ? new Date(item.updated_at).toLocaleString('en-US', { month: 'short' }) : 'New';
        monthly[month] = (monthly[month] || 0) + 1;
    });

    state.charts.value = new Chart($('#valueChart'), {
        type: 'bar',
        data: {
            labels: topValueItems.map((item) => item.name),
            datasets: [{
                label: 'Stock Value',
                data: topValueItems.map((item) => item.qty * item.price),
                backgroundColor: ['#4F46E5', '#7C3AED', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444', '#E5E7EB'],
                borderRadius: 12,
            }],
        },
        options: chartOptions(),
    });

    state.charts.category = new Chart($('#categoryChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#4F46E5', '#7C3AED', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444'],
                borderWidth: 0,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: getComputedStyle(document.body).getPropertyValue('--muted').trim() } } },
        },
    });

    state.charts.trend = new Chart($('#trendChart'), {
        type: 'line',
        data: {
            labels: Object.keys(monthly),
            datasets: [
                {
                    label: 'Monthly Updates',
                    data: Object.values(monthly),
                    borderColor: '#06B6D4',
                    backgroundColor: 'rgba(6, 182, 212, 0.14)',
                    tension: 0.42,
                    fill: true,
                },
                {
                    label: 'Average Stock',
                    data: Object.keys(monthly).map(() => {
                        const total = state.items.reduce((sum, item) => sum + item.qty, 0);
                        return state.items.length ? Math.round(total / state.items.length) : 0;
                    }),
                    borderColor: '#7C3AED',
                    tension: 0.42,
                },
            ],
        },
        options: chartOptions(),
    });
}

async function loadItems(showSpinner = true) {
    if (showSpinner) {
        showLoading(true);
    }

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Unable to load inventory records.');
        }

        state.items = (await response.json()).map(normalizeItem);
        updateCategoryControls();
        updateStats();
        renderTable();
        renderActivity();
        renderCharts();
    } catch (error) {
        toast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function saveItem(event) {
    event.preventDefault();
    const payload = formPayload();
    const editing = Boolean(fields.id.value);
    const url = editing ? `${apiUrl}/${fields.id.value}` : apiUrl;
    const method = editing ? 'PUT' : 'POST';

    showLoading(true);
    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'The item could not be saved.');
        }

        toast(result.message);
        logActivity(`${editing ? 'Updated' : 'Created'} ${payload.name}`, editing ? 'pencil' : 'plus');
        resetForm();
        await loadItems(false);
    } catch (error) {
        toast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function editItem(id) {
    const item = state.items.find((record) => String(record.id) === String(id));
    if (!item) {
        toast('Item not found.', 'error');
        return;
    }

    fields.id.value = item.id;
    fields.name.value = item.name;
    fields.description.value = item.desc;
    fields.quantity.value = item.qty;
    fields.price.value = item.price;
    fields.category.value = item.category;
    fields.supplier.value = item.supplier;
    fields.sku.value = item.sku;
    fields.barcode.value = item.barcode;
    fields.purchaseDate.value = item.purchase_date;
    fields.expiryDate.value = item.expiry_date;
    fields.minStock.value = item.min_stock;
    fields.status.value = item.status;
    fields.image.value = item.image;
    $('#imagePreview').innerHTML = item.image
        ? `<img src="${item.image}" alt="${escapeHtml(item.name)}">`
        : '<i data-lucide="image-plus"></i>';
    $('#formTitle').textContent = 'Update Product';
    $('#submitButton').innerHTML = '<i data-lucide="save"></i> Update Product';
    $('#resetButton').classList.remove('hidden');
    fields.name.focus();
    window.scrollTo({ top: $('#itemForm').offsetTop - 24, behavior: 'smooth' });
    refreshIcons();
}

function openDeleteDialog(id) {
    const item = state.items.find((record) => String(record.id) === String(id));
    state.deleteId = id;
    $('#confirmText').textContent = `Delete "${item?.name || 'this product'}" from inventory? This action cannot be undone.`;
    $('#confirmDialog').classList.remove('hidden');
}

async function deleteItem() {
    if (!state.deleteId) {
        return;
    }
    const item = state.items.find((record) => String(record.id) === String(state.deleteId));

    showLoading(true);
    try {
        const response = await fetch(`${apiUrl}/${state.deleteId}`, { method: 'DELETE' });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'The item could not be deleted.');
        }

        toast(result.message);
        logActivity(`Deleted ${item?.name || 'an item'}`, 'trash-2');
        state.deleteId = null;
        $('#confirmDialog').classList.add('hidden');
        await loadItems(false);
    } catch (error) {
        toast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function toCsv(items) {
    const headers = ['Name', 'Category', 'SKU', 'Barcode', 'Supplier', 'Quantity', 'Minimum Stock', 'Price', 'Status', 'Purchase Date', 'Expiry Date', 'Description'];
    const rows = items.map((item) => [
        item.name, item.category, item.sku, item.barcode, item.supplier, item.qty, item.min_stock,
        item.price, item.status, item.purchase_date, item.expiry_date, item.desc,
    ]);
    return [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
        .join('\n');
}

function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function exportCsv() {
    downloadFile('inventory-export.csv', toCsv(state.filtered.length ? state.filtered : state.items), 'text/csv;charset=utf-8;');
    toast('CSV export generated.');
}

function exportExcel() {
    const rows = (state.filtered.length ? state.filtered : state.items).map((item) => `
        <tr>
            <td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.category)}</td><td>${escapeHtml(item.sku)}</td>
            <td>${item.qty}</td><td>${item.price}</td><td>${escapeHtml(item.status)}</td>
        </tr>
    `).join('');
    const html = `<table><tr><th>Name</th><th>Category</th><th>SKU</th><th>Qty</th><th>Price</th><th>Status</th></tr>${rows}</table>`;
    downloadFile('inventory-export.xls', html, 'application/vnd.ms-excel');
    toast('Excel export generated.');
}

function printInventory() {
    window.print();
}

function exportPdf() {
    toast('Opening print dialog. Choose "Save as PDF" to export.');
    window.print();
}

function setTheme(theme) {
    document.body.dataset.theme = theme;
    localStorage.setItem('inventoryTheme', theme);
    $('#themeToggle').innerHTML = `<i data-lucide="${theme === 'dark' ? 'sun-medium' : 'moon'}"></i>`;
    refreshIcons();
    renderCharts();
}

function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
        return;
    }
    if (!file.type.startsWith('image/')) {
        toast('Please choose an image file.', 'error');
        return;
    }
    if (file.size > 800000) {
        toast('Use an image smaller than 800 KB for fast loading.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        fields.image.value = reader.result;
        $('#imagePreview').innerHTML = `<img src="${reader.result}" alt="Product preview">`;
    };
    reader.readAsDataURL(file);
}

function bindEvents() {
    fields.form.addEventListener('submit', saveItem);
    $('#resetButton').addEventListener('click', resetForm);
    $('#quickAddButton').addEventListener('click', () => fields.name.focus());
    $('#refreshButton').addEventListener('click', () => loadItems());
    $('#csvButton').addEventListener('click', exportCsv);
    $('#excelButton').addEventListener('click', exportExcel);
    $('#pdfButton').addEventListener('click', exportPdf);
    $('#printButton').addEventListener('click', printInventory);
    $('#imageUpload').addEventListener('change', handleImageUpload);
    $('#confirmDelete').addEventListener('click', deleteItem);
    $('#cancelDelete').addEventListener('click', () => $('#confirmDialog').classList.add('hidden'));

    $('#searchInput').addEventListener('input', () => {
        state.page = 1;
        renderTable();
    });
    const navSearch = $('#navSearch');
    if (navSearch) {
        navSearch.addEventListener('input', (event) => {
            $('#searchInput').value = event.target.value;
            state.page = 1;
            renderTable();
        });
    }
    $('#categoryFilter').addEventListener('change', () => {
        state.page = 1;
        renderTable();
    });
    $('#sortSelect').addEventListener('change', (event) => {
        state.sort = event.target.value;
        renderTable();
    });

    $('#inventoryTable thead').addEventListener('click', (event) => {
        const header = event.target.closest('[data-sort]');
        if (!header) {
            return;
        }
        const key = header.dataset.sort;
        const [activeKey, direction] = state.sort.split('-');
        state.sort = `${key}-${activeKey === key && direction === 'asc' ? 'desc' : 'asc'}`;
        $('#sortSelect').value = state.sort;
        renderTable();
    });

    $('#itemsTableBody').addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) {
            return;
        }
        if (button.classList.contains('edit-button')) {
            editItem(button.dataset.id);
        }
        if (button.classList.contains('delete-button')) {
            openDeleteDialog(button.dataset.id);
        }
    });

    $('#prevPage').addEventListener('click', () => {
        state.page = Math.max(1, state.page - 1);
        renderTable();
    });
    $('#nextPage').addEventListener('click', () => {
        const totalPages = Math.max(1, Math.ceil(state.filtered.length / pageSize));
        state.page = Math.min(totalPages, state.page + 1);
        renderTable();
    });

    $('#themeToggle').addEventListener('click', () => {
        setTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
    });
    $('#profileButton').addEventListener('click', () => {
        $('#profileDropdown').classList.toggle('hidden');
    });

    document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            $('#searchInput').focus();
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
            event.preventDefault();
            resetForm();
            fields.name.focus();
        }
        if (event.key === 'Escape') {
            $('#confirmDialog').classList.add('hidden');
            $('#profileDropdown').classList.add('hidden');
        }
    });
}

bindEvents();
setTheme(localStorage.getItem('inventoryTheme') || 'light');
refreshIcons();
loadItems();
