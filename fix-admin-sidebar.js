const fs = require('fs');

let layoutContent = fs.readFileSync('src/app/admin/(dashboard)/layout.tsx', 'utf8');
layoutContent = layoutContent.replace('import { AdminSidebar } from "@/components/admin/AdminSidebar";', 'import AdminSidebar from "@/components/admin/AdminSidebar";');
fs.writeFileSync('src/app/admin/(dashboard)/layout.tsx', layoutContent);
