const fs = require('fs');

let sidebar = fs.readFileSync('src/components/admin/AdminSidebar.tsx', 'utf8');
sidebar = sidebar.replace(/export default function AdminSidebar/g, 'export function AdminSidebar');
fs.writeFileSync('src/components/admin/AdminSidebar.tsx', sidebar);

let layout = fs.readFileSync('src/app/admin/(dashboard)/layout.tsx', 'utf8');
layout = layout.replace(/import AdminSidebar from "@\/components\/admin\/AdminSidebar";/g, 'import { AdminSidebar } from "@/components/admin/AdminSidebar";');
fs.writeFileSync('src/app/admin/(dashboard)/layout.tsx', layout);
