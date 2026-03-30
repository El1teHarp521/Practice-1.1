import React, { useState } from "react";
import { api } from "../api";

export default function Auth({ onLoginSuccess, onClose }) {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [formData, setFormData] = useState({ email: "", password: "", first_name: "", last_name: "" });
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            if (isLoginMode) {
                await api.login({ email: formData.email, password: formData.password });
            } else {
                await api.register(formData);
                await api.login({ email: formData.email, password: formData.password });
            }
            onLoginSuccess();
        } catch (err) { 
            setError(err.response?.data?.error || "Неверный логин или пароль"); 
        }
    };

    return (
        <div className="modal-overlay" onMouseDown={onClose}>
            <div className="auth-card" onMouseDown={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>
                
                <div className="modal-header">
                    <h2>{isLoginMode ? "С возвращением!" : "Создать аккаунт"}</h2>
                    <p>{isLoginMode ? "Войдите в свой профиль" : "Заполните данные для регистрации"}</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLoginMode && (
                        <div className="form-row">
                            <input 
                                placeholder="Имя" 
                                required 
                                value={formData.first_name} 
                                onChange={e => setFormData({...formData, first_name: e.target.value})} 
                            />
                            <input 
                                placeholder="Фамилия" 
                                required 
                                value={formData.last_name} 
                                onChange={e => setFormData({...formData, last_name: e.target.value})} 
                            />
                        </div>
                    )}
                    
                    <input 
                        type="email" 
                        placeholder="Ваш Email" 
                        required 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                    />
                    
                    <input 
                        type="password" 
                        placeholder="Пароль" 
                        required 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                    />

                    <button type="submit" className="btn btn--create btn--full">
                        {isLoginMode ? "Войти" : "Зарегистрироваться"}
                    </button>
                </form>

                <p className="auth-toggle">
                    {isLoginMode ? "Впервые у нас? " : "Уже есть аккаунт? "}
                    <span onClick={() => setIsLoginMode(!isLoginMode)}>
                        {isLoginMode ? "Зарегистрироваться" : "Войти"}
                    </span>
                </p>
            </div>
        </div>
    );
}