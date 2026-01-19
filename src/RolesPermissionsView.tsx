import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';

interface Role {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  permissions: string[];
}

const RolesPermissionsView: React.FC = () => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');

  const permissionCategories: Record<string, string[]> = {
    'Employees': ['VIEW_EMPLOYEES', 'CREATE_EMPLOYEES', 'EDIT_EMPLOYEES', 'DELETE_EMPLOYEES'],
    'Attendance': ['VIEW_ATTENDANCE', 'MANAGE_ATTENDANCE', 'VIEW_OWN_ATTENDANCE'],
    'Payroll': ['VIEW_PAYROLL', 'MANAGE_PAYROLL'],
    'System': ['MANAGE_ROLES', 'MANAGE_SETTINGS', 'VIEW_LOGS'],
    'Reports': ['VIEW_REPORTS']
  };

  const allPermissions = Object.values(permissionCategories).flat();

  const [roles, setRoles] = useState<Role[]>([
    { id: 'R-001', name: 'Admin', description: 'Full access to all system features', usersCount: 2, permissions: allPermissions },
    { id: 'R-002', name: 'HR Manager', description: 'Manage employees, attendance, and payroll', usersCount: 3, permissions: ['VIEW_EMPLOYEES', 'CREATE_EMPLOYEES', 'EDIT_EMPLOYEES', 'VIEW_ATTENDANCE', 'MANAGE_ATTENDANCE', 'VIEW_PAYROLL', 'MANAGE_PAYROLL', 'VIEW_REPORTS'] },
    { id: 'R-003', name: 'Employee', description: 'View own profile and attendance', usersCount: 120, permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_ATTENDANCE'] },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Partial<Role>>({ name: '', description: '', permissions: [] });
  const [isEditing, setIsEditing] = useState(false);

  const handleAddRole = () => {
    setCurrentRole({ name: '', description: '', permissions: [] });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setCurrentRole(role);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteRole = (id: string) => {
    if (window.confirm(t('confirmDeleteRole'))) {
      setRoles(roles.filter(role => role.id !== id));
    }
  };

  const handleSaveRole = () => {
    if (currentRole.name) {
      if (isEditing) {
        setRoles(roles.map(r => r.id === currentRole.id ? { ...r, ...currentRole } as Role : r));
      } else {
        const newRole: Role = {
          id: `R-${Date.now()}`,
          name: currentRole.name!,
          description: currentRole.description || '',
          usersCount: 0,
          permissions: currentRole.permissions || []
        };
        setRoles([...roles, newRole]);
      }
      setIsModalOpen(false);
    } else {
      alert(t('fillAllFields'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">{t('rolesTitle')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('rolesDesc')}</p>
        </div>
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
          <i className="fas fa-user-shield"></i>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <h3 className="font-black text-lg text-slate-800">{t('rolesTitle')}</h3>
               <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>قائمة</button>
                  <button onClick={() => setViewMode('matrix')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${viewMode === 'matrix' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>مصفوفة</button>
               </div>
            </div>
            <div className="flex gap-3">
               <button 
                 onClick={handleAddRole}
                 className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black shadow-lg hover:bg-indigo-700 transition flex items-center gap-2"
               >
                 <i className="fas fa-plus"></i> {t('addRole')}
               </button>
            </div>
        </div>
        {viewMode === 'list' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">{t('roleName')}</th>
                <th className="px-8 py-5">{t('roleDescription')}</th>
                <th className="px-8 py-5">{t('usersCount')}</th>
                <th className="px-8 py-5">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-8 py-6 font-bold text-slate-700">{role.name}</td>
                  <td className="px-8 py-6 text-sm text-slate-500">{role.description}</td>
                  <td className="px-8 py-6 font-bold text-indigo-600">{role.usersCount}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditRole(role)}
                        className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg transition"
                      >
                        <i className="fas fa-pen"></i> {t('edit')}
                      </button>
                      <button 
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-rose-600 hover:text-rose-800 font-bold text-xs flex items-center gap-2 bg-rose-50 px-3 py-2 rounded-lg transition"
                      >
                        <i className="fas fa-trash-can"></i> {t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-4 border border-slate-100 text-xs font-black text-slate-500 uppercase tracking-widest sticky right-0 bg-slate-50 z-10">الصلاحية / الدور</th>
                  {roles.map(role => (
                    <th key={role.id} className="p-4 border border-slate-100 text-xs font-black text-slate-800 text-center min-w-[120px]">
                      {role.name}
                      <div className="text-[9px] text-slate-400 font-normal mt-1">{role.usersCount} users</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(permissionCategories).map(([category, perms]) => (
                  <React.Fragment key={category}>
                    <tr className="bg-indigo-50/50">
                      <td colSpan={roles.length + 1} className="p-3 border border-slate-100 text-xs font-black text-indigo-600 uppercase tracking-widest sticky right-0 z-10">{category}</td>
                    </tr>
                    {perms.map(perm => (
                      <tr key={perm} className="hover:bg-slate-50 transition group">
                        <td className="p-4 border border-slate-100 text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors sticky right-0 bg-white group-hover:bg-slate-50 z-10">{t(perm) || perm}</td>
                        {roles.map(role => (
                          <td key={`${role.id}-${perm}`} className="p-4 border border-slate-100 text-center">
                            {role.permissions.includes(perm) ? (
                              <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto"><i className="fas fa-check text-[10px]"></i></div>
                            ) : (
                              <div className="w-6 h-6 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto"><i className="fas fa-times text-[10px]"></i></div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">{isEditing ? t('editRole') : t('addRole')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">{t('roleName')}</label>
                <input 
                  type="text" 
                  value={currentRole.name}
                  onChange={e => setCurrentRole({...currentRole, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">{t('roleDescription')}</label>
                <textarea 
                  value={currentRole.description}
                  onChange={e => setCurrentRole({...currentRole, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">{t('permissions')}</label>
                <div className="max-h-64 overflow-y-auto p-1 space-y-4 custom-scrollbar">
                  {Object.entries(permissionCategories).map(([category, perms]) => (
                    <div key={category}>
                      <h5 className="text-[10px] font-black text-indigo-500 uppercase mb-2 sticky top-0 bg-white py-1">{category}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {perms.map(perm => (
                          <label key={perm} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${currentRole.permissions?.includes(perm) ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}>
                            <input 
                              type="checkbox" 
                              checked={currentRole.permissions?.includes(perm) || false}
                              onChange={(e) => {
                                const newPerms = e.target.checked 
                                  ? [...(currentRole.permissions || []), perm]
                                  : (currentRole.permissions || []).filter(p => p !== perm);
                                setCurrentRole({...currentRole, permissions: newPerms});
                              }}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <span className={`text-[10px] font-bold ${currentRole.permissions?.includes(perm) ? 'text-indigo-700' : 'text-slate-600'}`}>{t(perm) || perm}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleSaveRole} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition mt-4">{t('saveRole')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPermissionsView;