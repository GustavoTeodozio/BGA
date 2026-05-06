require('dotenv/config');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

// Prisma 7: usar sintaxe simples (sem opções) - igual ao prisma.ts do projeto
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('\n🔐 Criando Administrador Inicial\n');

    // Dados do administrador
    const name = 'Gustavo Sampaio';
    const email = 'gustavo.sampaio195@gmail.com';
    const password = 'ronaldo12';

    console.log(`Criando admin: ${name} (${email})\n`);

    // Verificar se já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`⚠️  Usuário com email ${email} já existe!`);
      console.log(`   Atualizando senha e tenantId...\n`);

      const hashedPassword = await bcrypt.hash(password, 12);

      // Garantir que o tenant Sistema existe
      let defaultTenant = await prisma.tenant.findFirst({ where: { name: 'Sistema' } });
      if (!defaultTenant) {
        defaultTenant = await prisma.tenant.create({
          data: { name: 'Sistema', slug: 'sistema', isActive: true },
        });
        console.log('✅ Tenant padrão criado');
      }

      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword, tenantId: defaultTenant.id, role: 'ADMIN', isActive: true },
      });

      console.log('✅ Administrador atualizado com sucesso!\n');
      console.log(`   Email: ${email}`);
      console.log(`   TenantId: ${defaultTenant.id}\n`);
      await prisma.$disconnect();
      process.exit(0);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar tenant padrão se não existir
    let defaultTenant = await prisma.tenant.findFirst({
      where: { name: 'Sistema' },
    });

    if (!defaultTenant) {
      defaultTenant = await prisma.tenant.create({
        data: {
          name: 'Sistema',
          slug: 'sistema',
          isActive: true,
        },
      });
      console.log('✅ Tenant padrão criado');
    }

    // Criar usuário admin
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN',
        tenantId: defaultTenant.id,
        isActive: true,
      },
    });

    console.log('\n✅ Administrador criado com sucesso!');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Nome: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}\n`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao criar administrador:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    await prisma.$disconnect();
    process.exit(1);
  }
}

createAdmin();
