import React, { useEffect, useState } from "react";
import { api } from "./api";
import ProductModal from "./components/ProductModal";
import Auth from "./components/Auth";
import AdminPanel from "./components/AdminPanel";
import "./App.scss"; 

function App() {
  const [user, setUser] = useState(null); 
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => { loadProducts(); checkAuth(); }, []);

  const checkAuth = async () => {
    if (localStorage.getItem("accessToken")) {
        try { setUser(await api.getMe()); } catch (e) { setUser(null); }
    }
  };

  const loadProducts = async () => { try { setProducts(await api.getProducts()); } catch (e) {} };

  const handleFormSubmit = async (data) => {
    try {
      if (editingProduct) await api.updateProduct(editingProduct.id, data);
      else await api.createProduct(data);
      setModalOpen(false); loadProducts();
    } catch (e) { alert("Ошибка прав доступа!"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Удалить товар?")) {
      try { await api.deleteProduct(id); loadProducts(); } catch (e) { alert("Только для Админа!"); }
    }
  };

  const isAdmin = user?.role === 'admin';
  const isSeller = user?.role === 'seller' || isAdmin;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>МАГАЗИН</h1>
        <div className="user-panel">
            {user ? (
                <>
                    <div className="user-info">
                        <b>{user.first_name}</b>
                        <span className="role-tag">{user.role}</span>
                    </div>
                    {isAdmin && <button className="btn btn--outline" onClick={() => setIsAdminOpen(true)}>Пользователи</button>}
                    {isSeller && <button className="btn btn--create" onClick={() => {setEditingProduct(null); setModalOpen(true)}}>+ Товар</button>}
                    <button className="btn btn--outline" onClick={() => { api.logout(); setUser(null); window.location.reload(); }}>Выйти</button>
                </>
            ) : (
                <button className="btn btn--create" onClick={() => setIsAuthOpen(true)}>Войти / Регистрация</button>
            )}
        </div>
      </header>

      <div className="products-grid">
        {products.map((p) => (
          <div key={p.id} className="product-card">
            <div className="product-card__image-box">
                <span className="product-card__badge">{p.category}</span>
                <img src={p.image} alt={p.title} className="product-card__img" />
            </div>
            <div className="product-card__info">
                <h3 className="product-card__title">{p.title}</h3>
                <p className="product-card__desc">{p.description}</p>
                <div className="product-card__bottom">
                    <div className="product-card__price">{p.price?.toLocaleString('ru-RU')} ₽</div>
                    <div className="product-card__actions">
                        {isSeller && <button className="icon-btn" onClick={() => {setEditingProduct(p); setModalOpen(true)}}>Изменить</button>}
                        {isAdmin && <button className="icon-btn icon-btn--delete" onClick={() => handleDelete(p.id)}>Удалить</button>}
                    </div>
                </div>
            </div>
          </div>
        ))}
      </div>

      <ProductModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSubmit={handleFormSubmit} initialData={editingProduct} />
      {isAuthOpen && <Auth onClose={() => setIsAuthOpen(false)} onLoginSuccess={() => { setIsAuthOpen(false); checkAuth(); }} />}
      {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} />}
    </div>
  );
}

export default App;