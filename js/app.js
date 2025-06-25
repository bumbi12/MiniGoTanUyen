document.addEventListener('DOMContentLoaded', () => {
  if (!firebase.apps.length) {
    console.error('Firebase chưa được khởi tạo!');
    showFirebaseError();
    return;
  }

  window.db = firebase.firestore();
  
  document.getElementById('addProductBtn').addEventListener('click', showAddProductModal);
  document.getElementById('searchInput').addEventListener('input', handleSearch);
  
  loadProducts();
});

function showFirebaseError() {
  const productList = document.getElementById('productList');
  productList.innerHTML = `
    <div class="col-12 text-center my-5">
      <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
      <h4 class="text-danger">Lỗi kết nối cơ sở dữ liệu</h4>
      <button class="btn btn-primary" onclick="window.location.reload()">
        <i class="fas fa-sync-alt"></i> Tải lại trang
      </button>
    </div>`;
}

async function loadProducts() {
  const productList = document.getElementById('productList');
  productList.innerHTML = `
    <div class="col-12 text-center my-5">
      <div class="spinner-border text-primary"></div>
      <p class="mt-2">Đang tải sản phẩm...</p>
    </div>`;

  try {
    const snapshot = await db.collection("products").get();
    productList.innerHTML = '';
    
    if (snapshot.empty) {
      productList.innerHTML = `
        <div class="col-12 text-center my-5">
          <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
          <p class="text-muted">Không có sản phẩm nào</p>
        </div>`;
      return;
    }

    snapshot.forEach((doc, index) => {
      const product = doc.data();
      productList.innerHTML += `
        <div class="col-md-4 mb-4">
          <div class="card product-card" style="animation-delay: ${index * 0.1}s">
            ${product.image ? `<img src="${product.image}" class="card-img-top" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">` : ''}
            <div class="card-body">
              <h5 class="card-title">${product.name || 'Chưa đặt tên'}</h5>
              <div class="d-grid gap-2">
                <button class="btn btn-primary btn-action" onclick="openNoteModal('${doc.id}', '${escapeHtml(product.name)}')">
                  <i class="fas fa-edit"></i> Thêm ghi chú
                </button>
                <button class="btn btn-info btn-action" onclick="viewNotes('${doc.id}', '${escapeHtml(product.name)}')">
                  <i class="fas fa-history"></i> Lịch sử
                </button>
              </div>
            </div>
          </div>
        </div>`;
    });
  } catch (error) {
    console.error("Lỗi tải sản phẩm:", error);
    productList.innerHTML = `
      <div class="col-12 text-center my-5">
        <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
        <p class="text-danger">Lỗi khi tải dữ liệu</p>
      </div>`;
  }
}

function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  const cards = document.querySelectorAll('.product-card');
  
  cards.forEach(card => {
    const productName = card.querySelector('.card-title').textContent.toLowerCase();
    card.style.display = productName.includes(searchTerm) ? '' : 'none';
  });
}

function showAddProductModal() {
  const modalHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Thêm sản phẩm mới</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form id="productForm">
            <div class="mb-3">
              <label class="form-label">Tên sản phẩm *</label>
              <input type="text" class="form-control" id="productName" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Ảnh sản phẩm (URL)</label>
              <input type="url" class="form-control" id="productImage">
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
          <button type="button" class="btn btn-primary" onclick="addProduct()">Lưu sản phẩm</button>
        </div>
      </div>
    </div>`;
  
  document.getElementById('productModal').innerHTML = modalHTML;
  new bootstrap.Modal(document.getElementById('productModal')).show();
}

async function addProduct() {
  const name = document.getElementById('productName').value.trim();
  const image = document.getElementById('productImage').value.trim();
  
  if (!name) {
    alert("Vui lòng nhập tên sản phẩm");
    return;
  }
  
  try {
    await db.collection("products").add({
      name,
      image: image || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
    loadProducts();
  } catch (error) {
    alert("Lỗi khi thêm sản phẩm: " + error.message);
  }
}

window.openNoteModal = function(productId, productName) {
  const modalHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Thêm ghi chú cho ${productName}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form id="noteForm">
            <div class="mb-3">
              <label class="form-label">Ngày *</label>
              <input type="date" class="form-control" id="noteDate" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Số lượng *</label>
              <input type="number" class="form-control" id="noteQuantity" min="1" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Ghi chú</label>
              <textarea class="form-control" id="noteRemarks" rows="3"></textarea>
            </div>
            <input type="hidden" id="currentProductId" value="${productId}">
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
          <button type="button" class="btn btn-primary" onclick="saveNote()">Lưu ghi chú</button>
        </div>
      </div>
    </div>`;
  
  document.getElementById('productModal').innerHTML = modalHTML;
  const modal = new bootstrap.Modal(document.getElementById('productModal'));
  document.getElementById('noteDate').valueAsDate = new Date();
  modal.show();
};

window.saveNote = async function() {
  const productId = document.getElementById('currentProductId').value;
  const date = document.getElementById('noteDate').value;
  const quantity = parseInt(document.getElementById('noteQuantity').value);
  const remarks = document.getElementById('noteRemarks').value;
  
  if (!date || isNaN(quantity)) {
    alert("Vui lòng nhập đủ thông tin bắt buộc");
    return;
  }
  
  try {
    await db.collection("product_notes").add({
      productId,
      date,
      quantity,
      remarks: remarks || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
  } catch (error) {
    alert("Lỗi khi lưu ghi chú: " + error.message);
  }
};

window.viewNotes = async function(productId, productName) {
  try {
    const modalHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Lịch sử nhập: ${productName}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Số lượng</th>
                    <th>Ghi chú</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody id="notesTableBody"></tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
          </div>
        </div>
      </div>`;
    
    document.getElementById('notesModal').innerHTML = modalHTML;
    const modal = new bootstrap.Modal(document.getElementById('notesModal'));
    modal.show();
    
    const tbody = document.getElementById('notesTableBody');
    const snapshot = await db.collection("product_notes")
      .where("productId", "==", productId)
      .orderBy("date", "desc")
      .get();
    
    tbody.innerHTML = snapshot.empty 
      ? '<tr><td colspan="4" class="text-center text-muted">Chưa có dữ liệu nhập kho</td></tr>'
      : '';
    
    snapshot.forEach(doc => {
      const note = doc.data();
      tbody.innerHTML += `
        <tr>
          <td>${note.date}</td>
          <td>${note.quantity}</td>
          <td>${note.remarks || '---'}</td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="deleteNote('${doc.id}')">
              <i class="fas fa-trash-alt"></i> Xóa
            </button>
          </td>
        </tr>`;
    });
  } catch (error) {
    console.error("Error loading notes:", error);
    document.getElementById('notesTableBody').innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-danger">
          Lỗi khi tải dữ liệu: ${error.message}
        </td>
      </tr>`;
  }
};

window.deleteNote = async function(noteId) {
  if (!confirm("Bạn chắc chắn muốn xóa ghi chú này?")) return;
  
  try {
    await db.collection("product_notes").doc(noteId).delete();
    const modal = bootstrap.Modal.getInstance(document.getElementById('notesModal'));
    modal.hide();
  } catch (error) {
    alert("Lỗi khi xóa ghi chú: " + error.message);
  }
};

function escapeHtml(text) {
  return text ? text.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;") : '';
}