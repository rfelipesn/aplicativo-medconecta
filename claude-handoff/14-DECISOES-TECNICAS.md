# Decisões técnicas

- Monorepo npm/Turborepo para compartilhar contratos e separar mobile/web/API/db.
- Supabase é BaaS principal; Prisma fornece acesso tipado ao Postgres.
- Mobile é offline-first com WatermelonDB; web é painel médico separado.
- Auth usa CPF/email + senha e Supabase Auth, sem SMS/OTP pago.
- Arquivos ficam em buckets privados com signed URLs.
- Visual do paciente segue Fluent Accent: superfícies claras, azul-petróleo, gradiente, cartões arredondados e acentos laranja/lilás; referência em `app-mockup.canvas.tsx` e documentação.
- Estas decisões são confirmadas por código/documentação, mas motivos históricos devem ser validados antes de revisão.
