# Backend já publicado

Projeto: veste-bem-testes (`rtjikqnszwutfgknemwt`).
Função: `wedding-if-reservations`, com verificação JWT habilitada.
Tabela: `public.wedding_if_reservations`.

O navegador chama a função usando a chave pública anon. O backend usa a chave privilegiada injetada pelo Supabase. CORS aceita domínios externos e as operações GET, POST e DELETE. A tabela é inacessível diretamente a anon/authenticated, possui RLS e uma chave primária por presente.

`schema.sql` documenta a estrutura aplicada pela migração remota `20261020000321_create_wedding_if_reservations`.
Os arquivos desta pasta são uma cópia para manutenção; não execute o SQL sobre a tabela existente e não recrie o banco ao publicar o site.
