import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function AdminPanel({ onClose }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await api.getUsers();
            setUsers(data);
        } catch (e) {
            alert("Ошибка доступа!");
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (id, newRole) => {
        await api.updateUserRole(id, newRole);
        loadUsers();
    };

    const handleBlock = async (id) => {
        await api.toggleBlockUser(id);
        loadUsers();
    };

    return (
        <div className="modal-overlay" onMouseDown={onClose}>
            <div className="modal-card modal-card--large" onMouseDown={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>
                
                <div className="modal-header">
                    <h2>Команда и пользователи</h2>
                    <p>Управление ролями и доступом к системе</p>
                </div>

                <div className="admin-scroll-area">
                    {loading ? (
                        <div className="loader">Загрузка...</div>
                    ) : (
                        <div className="admin-grid">
                            {users.map(u => (
                                <div key={u.id} className={`user-manage-card ${u.isBlocked ? 'is-blocked' : ''}`}>
                                    <div className="user-manage-info">
                                        <div className="user-avatar">
                                            {u.first_name[0]}
                                        </div>
                                        <div>
                                            <div className="user-name">
                                                {u.first_name} 
                                                {u.isBlocked && <span className="blocked-badge">Заблокирован</span>}
                                            </div>
                                            <div className="user-email">{u.email}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="user-manage-actions">
                                        <div className="admin-select-wrapper">
                                            <select 
                                                value={u.role} 
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                className="admin-select"
                                            >
                                                <option value="user">Пользователь</option>
                                                <option value="seller">Продавец</option>
                                                <option value="admin">Администратор</option>
                                            </select>
                                        </div>
                                        
                                        <button 
                                            className={`btn btn--small ${u.isBlocked ? 'btn--success' : 'btn--danger-text'}`} 
                                            onClick={() => handleBlock(u.id)}
                                        >
                                            {u.isBlocked ? "Разблокировать" : "Заблокировать"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}