const fs = require('fs');

let contact = fs.readFileSync('src/components/ui/SocialLinks/ContactSocialLinks.tsx', 'utf8');
contact = contact.replace(/name=\{link\.icon_name\}/g, 'name={link.icon_name || "link"}');
fs.writeFileSync('src/components/ui/SocialLinks/ContactSocialLinks.tsx', contact);

let footer = fs.readFileSync('src/components/ui/SocialLinks/FooterSocialLinks.tsx', 'utf8');
footer = footer.replace(/name=\{link\.icon_name\}/g, 'name={link.icon_name || "link"}');
fs.writeFileSync('src/components/ui/SocialLinks/FooterSocialLinks.tsx', footer);
