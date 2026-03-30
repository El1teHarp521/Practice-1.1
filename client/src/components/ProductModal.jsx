import React, { useState, useEffect } from "react";

export default function ProductModal({ isOpen, onClose, onSubmit, initialData }) {
    const [formData, setFormData] = useState({
        title: "", category: "", description: "", price: "", stock: "", image: ""
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({ title: "", category: "", description: "", price: "", stock: "", image: "" });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="modal-overlay" onMouseDown={onClose}>
            <div className="modal-card" onMouseDown={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>
                
                <div className="modal-header">
                    <h2>{initialData ? "Редактировать" : "Новый товар"}</h2>
                    <p>Заполните информацию о продукте</p>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Название товара</label>
                        <input 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})} 
                            required 
                            placeholder="Например: iPhone 15 Pro"
                        />
                    </div>

                    <div className="form-group">
                        <label>Категория</label>
                        <input 
                            value={formData.category} 
                            onChange={e => setFormData({...formData, category: e.target.value})} 
                            placeholder="Смартфоны, Ноутбуки..."
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Цена (₽)</label>
                            <input 
                                type="number" 
                                value={formData.price} 
                                onChange={e => setFormData({...formData, price: e.target.value})} 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label>На складе (шт)</label>
                            <input 
                                type="number" 
                                value={formData.stock} 
                                onChange={e => setFormData({...formData, stock: e.target.value})} 
                                required 
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Ссылка на изображение</label>
                        <input 
                            value={formData.image} 
                            onChange={e => setFormData({...formData, image: e.target.value})} 
                            placeholder="https://..."
                        />
                    </div>

                    <div className="form-group">
                        <label>Описание</label>
                        <textarea 
                            rows="3"
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})} 
                            placeholder="Краткое описание товара..."
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn--outline" onClick={onClose}>Отмена</button>
                        <button type="submit" className="btn btn--create">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
    );
}