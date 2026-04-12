import React from 'react';
import SidebarAdmin from './SidebarAdmin';
import NavbarAdmin from './NavbarAdmin';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
    return (
        <div className="flex h-screen w-full overflow-hidden">
            {/* Sidebar */}
            <SidebarAdmin />
            {/* Nội dung chính */}
            <div className="flex flex-col flex-1 min-w-0 max-w-full overflow-hidden">
                <NavbarAdmin />
                <main className="p-6 bg-[#E5E7EB] flex-1 min-w-0 max-w-full overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>

        
    );
};

export default AdminLayout;