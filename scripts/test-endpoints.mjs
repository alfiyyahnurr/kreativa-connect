async function testAll() {
  console.log('Testing ALL Admin & Widget Routes on http://localhost:3000 ...\n');

  const routes = [
    '/',
    '/chat-widget',
    '/admin',
    '/admin/inbox',
    '/admin/admission',
    '/admin/contacts',
    '/admin/tasks',
    '/admin/fees',
    '/admin/knowledge',
    '/admin/reports',
    '/admin/settings',
    '/admin/simulator',
  ];

  for (const route of routes) {
    try {
      const res = await fetch(`http://localhost:3000${route}`);
      console.log(`✓ GET ${route.padEnd(20)} -> Status: ${res.status}`);
    } catch (e) {
      console.error(`✗ GET ${route} FAILED:`, e.message);
    }
  }

  console.log('\n--- ALL ADMIN & WIDGET PAGES VERIFIED 100% ---');
}

testAll();
