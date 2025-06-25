document.addEventListener('DOMContentLoaded', () => {
  const productList = document.getElementById('productList');
  const addProductBtn = document.getElementById('addProductBtn');
  
  // Thêm sự kiện tìm kiếm
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
  
  addProductBtn.addEventListener('click', showAddProductModal);
  loadProducts();
});

// Thêm hàm xử lý tìm kiếm
function handleSearch() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const cards = document.querySelectorAll('.product-card');
  
  cards.forEach(card => {
    const productName = card.querySelector('.card-title').textContent.toLowerCase();
    const parentCol = card.closest('.col-md-4');
    if (productName.includes(searchTerm)) {
      parentCol.style.display = '';
    } else {
      parentCol.style.display = 'none';
    }
  });
}

async function loadProducts() {
  try {
    productList.innerHTML = '<div class="col-12 text-center"><div class="loading-spinner"></div></div>';
    
    const snapshot = await db.collection("products").get();
    productList.innerHTML = '';
    
    if (snapshot.empty) {
      productList.innerHTML = '<div class="col-12 text-center text-muted">Chưa có sản phẩm nào</div>';
      return;
    }
    
    snapshot.forEach(doc => {
      const product = doc.data();
      productList.innerHTML += `
        <div class="col-md-4">
          <div class="card product-card h-100" data-product-name="${product.name.toLowerCase()}">
            ${product.image ? `<img src="${product.image}" class="card-img-top" alt="${product.name}">` : ''}
            <div class="card-body">
              <h5 class="card-title">${product.name}</h5>
              <div class="d-grid gap-2">
                <button class="btn btn-primary btn-action" 
                        onclick="openNoteModal('${doc.id}', '${product.name.replace(/'/g, "\\'")}')">
                  <i class="fas fa-edit"></i> Thêm ghi chú
                </button>
                <button class="btn btn-info btn-action" 
                        onclick="viewNotes('${doc.id}', '${product.name.replace(/'/g, "\\'")}')">
                  <i class="fas fa-history"></i> Lịch sử
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error("Error loading products:", error);
    productList.innerHTML = '<div class="col-12 text-center text-danger">Lỗi khi tải sản phẩm</div>';
  }
}

// Các hàm còn lại giữ nguyên không thay đổi
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
    </div>
  `;
  
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
              <input type="date" class="form-control" id="noteDate" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="mb-3">
              <label class="form-label">Số lượng *</label>
              <input type="number" class="form-control" id="noteQuantity" min="1" required value="1">
            </div>
            <div class="mb-3">
              <label class="form-label">Ghi chú</label>
              <textarea class="form-control" id="noteRemarks" rows="3" placeholder="Nhập ghi chú..."></textarea>
            </div>
            <input type="hidden" id="currentProductId" value="${productId}">
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
          <button type="button" class="btn btn-primary" onclick="saveNote()">Lưu ghi chú</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('productModal').innerHTML = modalHTML;
  new bootstrap.Modal(document.getElementById('productModal')).show();
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
    alert("Đã thêm ghi chú thành công!");
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
                <tbody id="notesTableBody">
                  <tr>
                    <td colspan="4" class="text-center">
                      <div class="loading-spinner"></div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('notesModal').innerHTML = modalHTML;
    const modal = new bootstrap.Modal(document.getElementById('notesModal'));
    modal.show();
    
    const tbody = document.getElementById('notesTableBody');
    const snapshot = await db.collection("product_notes")
      .where("productId", "==", productId)
      .orderBy("date", "desc")
      .get();
    
    tbody.innerHTML = '';
    
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Chưa có dữ liệu</td></tr>';
      return;
    }
    
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
        </tr>
      `;
    });
  } catch (error) {
    console.error("Error loading notes:", error);
    document.getElementById('notesTableBody').innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-danger">
          Lỗi khi tải dữ liệu: ${error.message}
        </td>
      </tr>
    `;
  }
};

window.deleteNote = async function(noteId) {
  if (!confirm("Bạn chắc chắn muốn xóa ghi chú này?")) return;
  
  try {
    await db.collection("product_notes").doc(noteId).delete();
    alert("Đã xóa ghi chú thành công!");
    const modal = bootstrap.Modal.getInstance(document.getElementById('notesModal'));
    modal.hide();
  } catch (error) {
    alert("Lỗi khi xóa ghi chú: " + error.message);
  }
};
