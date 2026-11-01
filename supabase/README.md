# Backend já publicado

Projeto: veste-bem-testes (`rtjikqnszwutfgknemwt`).
Funções:
- `wedding-if-reservations` (reservas exclusivas da lista de presentes)
- `wedding-if-rsvps` (confirmação de presença e lista de convidados)

Tabelas:
- `public.wedding_if_reservations`
- `public.wedding_if_rsvps`

O navegador chama as funções usando a chave pública anon. O backend usa as credenciais privilegiadas injetadas pelo Supabase. CORS aceita domínios externos e as operações GET, POST e DELETE. As tabelas são inacessíveis diretamente a anon/authenticated e possuem RLS.

`schema.sql` documenta a estrutura aplicada no banco de dados.
Os arquivos desta pasta são uma cópia para manutenção; não execute o SQL sobre as tabelas existentes e não recrie o banco ao publicar o site.
