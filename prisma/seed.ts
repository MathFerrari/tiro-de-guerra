import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { MilitaryType, Role } from "../generated/prisma/client";

async function main() {
  const passwordHash = await bcrypt.hash("tg0280", 10);

  await prisma.user.upsert({
    where: { email: "admin@tg.local" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@tg.local",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  const militares = [
    { numero: 1, nome: 'ARTHUR DANIEL CONCEICAO MARTINEZ', nome_guerra: 'MARTINEZ', tipo: MilitaryType.ATIRADOR },
    { numero: 2, nome: 'ARTHUR FELIPE SILVA DIAS', nome_guerra: 'DIAS', tipo: MilitaryType.ATIRADOR },
    { numero: 3, nome: 'CAIO CESAR DA SILVA', nome_guerra: 'CÉSAR', tipo: MilitaryType.ATIRADOR },
    { numero: 4, nome: 'CAUAN CARVALHO KOBO DE OLIVEIRA', nome_guerra: 'KOBO', tipo: MilitaryType.ATIRADOR },
    { numero: 5, nome: 'DANIEL DE ALMEIDA', nome_guerra: 'ALMEIDA', tipo: MilitaryType.ATIRADOR },
    { numero: 6, nome: 'DENER CHRISTIAN ALVES DA SILVA', nome_guerra: 'ALVES', tipo: MilitaryType.ATIRADOR },
    { numero: 7, nome: 'EDUARDO DAVOLI DE AQUINO', nome_guerra: 'DAVOLI', tipo: MilitaryType.CB_DE_DIA },
    { numero: 8, nome: 'EVERTON HENRIQUE ALVES MACHADO', nome_guerra: 'MACHADO', tipo: MilitaryType.ATIRADOR },
    { numero: 9, nome: 'FELIPE VINICIUS CAMPANHA DE SOUZA', nome_guerra: 'SOUZA', tipo: MilitaryType.ATIRADOR },
    { numero: 10, nome: 'GABRIEL ALVES DO NASCIMENTO', nome_guerra: 'NASCIMENTO', tipo: MilitaryType.ATIRADOR },
    { numero: 11, nome: 'GABRIEL DA SILVA SOARES', nome_guerra: 'SOARES', tipo: MilitaryType.ATIRADOR },
    { numero: 12, nome: 'GABRIEL HENRIQUE DE OLIVEIRA', nome_guerra: 'OLIVEIRA', tipo: MilitaryType.ATIRADOR },
    { numero: 13, nome: 'GIOVANI FERNANDO DE ALBUQUERQUE', nome_guerra: 'ALBUQUERQUE', tipo: MilitaryType.ATIRADOR },
    { numero: 14, nome: 'GUILHERME DA SILVA SANTANA', nome_guerra: 'SANTANA', tipo: MilitaryType.ATIRADOR },
    { numero: 15, nome: 'HEITOR SILVA GRESPI CORRADI', nome_guerra: 'CORRADI', tipo: MilitaryType.CB_DE_DIA },
    { numero: 16, nome: 'ISAAC SEIJI TAGAWA', nome_guerra: 'TAGAWA', tipo: MilitaryType.ATIRADOR },
    { numero: 17, nome: 'JOAO ANTONIO DE AGUIAR LINO', nome_guerra: 'LINO', tipo: MilitaryType.ATIRADOR },
    { numero: 18, nome: 'JOAO GABRIEL ALVES VASCONCELOS DA SILVA', nome_guerra: 'SILVA', tipo: MilitaryType.ATIRADOR },
    { numero: 19, nome: 'JOAO MIGUEL AZEDO', nome_guerra: 'AZEDO', tipo: MilitaryType.ATIRADOR },
    { numero: 20, nome: 'JOAO PEDRO MARANHA', nome_guerra: 'MARANHA', tipo: MilitaryType.ATIRADOR },
    { numero: 21, nome: 'JONATAN LUCAS MARINETTO ROGERIO', nome_guerra: 'MARINETTO', tipo: MilitaryType.ATIRADOR },
    { numero: 22, nome: 'JORGE NAUR CAMARGO JUNIOR', nome_guerra: 'NAUR', tipo: MilitaryType.ATIRADOR },
    { numero: 23, nome: 'JOSE AUGUSTO MENEGASSI', nome_guerra: 'MENEGASSI', tipo: MilitaryType.ATIRADOR },
    { numero: 24, nome: 'KAUAN APARECIDO TRONCON DE VASCONCELOS', nome_guerra: 'VASCONCELOS', tipo: MilitaryType.ATIRADOR },
    { numero: 25, nome: 'KAUE APARECIDO PEREIRA DOS SANTOS', nome_guerra: 'PEREIRA', tipo: MilitaryType.ATIRADOR },
    { numero: 26, nome: 'LEANDRO GABRIEL DOS SANTOS MELO', nome_guerra: 'MELO', tipo: MilitaryType.ATIRADOR },
    { numero: 27, nome: 'LEOLTON DIMAS SILVA', nome_guerra: 'DIMAS', tipo: MilitaryType.ATIRADOR },
    { numero: 28, nome: 'LUCAS CASTORINO FERREIRA DA SILVA', nome_guerra: 'CASTORINO', tipo: MilitaryType.ATIRADOR },
    { numero: 29, nome: 'LUCAS MASTELINI', nome_guerra: 'MASTELINI', tipo: MilitaryType.CB_DE_DIA },
    { numero: 30, nome: 'LUCAS TINETI UTRAGO', nome_guerra: 'UTRAGO', tipo: MilitaryType.ATIRADOR },
    { numero: 31, nome: 'LUCIANO OLIVEIRA DOS SANTOS CEULIN', nome_guerra: 'CEULIN', tipo: MilitaryType.ATIRADOR },
    { numero: 32, nome: 'MARCELO GOMES LUIZ', nome_guerra: 'GOMES', tipo: MilitaryType.CB_DE_DIA },
    { numero: 33, nome: 'MATEUS DE MELLO VIEIRA MASIERO', nome_guerra: 'VIEIRA', tipo: MilitaryType.CB_DE_DIA },
    { numero: 34, nome: 'MATEUS HENRIQUE FERREIRA BENICIO', nome_guerra: 'BENÍCIO', tipo: MilitaryType.ATIRADOR },
    { numero: 35, nome: 'MATHEUS APARECIDO GOMES FERRARI', nome_guerra: 'FERRARI', tipo: MilitaryType.CB_DE_DIA },
    { numero: 36, nome: 'MATHEUS RIBEIRO DA SILVA', nome_guerra: 'RIBEIRO', tipo: MilitaryType.ATIRADOR },
    { numero: 37, nome: 'MATHEUS SIMOCELLI', nome_guerra: 'SIMOCELLI', tipo: MilitaryType.CB_DE_DIA },
    { numero: 38, nome: 'MICHAEL TEIXEIRA LORENCETE', nome_guerra: 'LORENCETE', tipo: MilitaryType.ATIRADOR },
    { numero: 39, nome: 'MURILO VERGILIO DA COSTA', nome_guerra: 'VERGILIO', tipo: MilitaryType.CB_DE_DIA },
    { numero: 40, nome: 'PEDRO HENRIQUE DA ROCHA XOLIS VIEIRA', nome_guerra: 'ROCHA', tipo: MilitaryType.ATIRADOR },
    { numero: 41, nome: 'RIAN FERNANDO CAMARGO BACAN', nome_guerra: 'CAMARGO', tipo: MilitaryType.ATIRADOR },
    { numero: 42, nome: 'RICHARD MATHEUS MANCANO DA SILVA', nome_guerra: 'MANÇANO', tipo: MilitaryType.ATIRADOR },
    { numero: 43, nome: 'ROBERTO DE SOUZA NETO', nome_guerra: 'NETO', tipo: MilitaryType.CB_DE_DIA },
    { numero: 44, nome: 'RODOLFO DE OLIVEIRA SOUZA', nome_guerra: 'RODOLFO', tipo: MilitaryType.ATIRADOR },
    { numero: 45, nome: 'RYAN VITORIO DA SILVA MESQUITA', nome_guerra: 'MESQUITA', tipo: MilitaryType.CB_DE_DIA },
    { numero: 46, nome: 'THIAGO HENRIQUE DOS SANTOS OLIVEIRA', nome_guerra: 'THIAGO', tipo: MilitaryType.ATIRADOR },
    { numero: 47, nome: 'VICTOR HENRIQUE BALISTA DOS SANTOS', nome_guerra: 'BALISTA', tipo: MilitaryType.CB_DE_DIA },
    { numero: 48, nome: 'VINICIUS DOS SANTOS LIMA', nome_guerra: 'LIMA', tipo: MilitaryType.ATIRADOR },
    { numero: 49, nome: 'VINICIUS GABRIEL DE ALMEIDA', nome_guerra: 'VINÍCIUS ALMEIDA', tipo: MilitaryType.ATIRADOR },
    { numero: 50, nome: 'VITOR FUAD MENEGHETTI HADDAD', nome_guerra: 'FUAD', tipo: MilitaryType.ATIRADOR },
  ];

  for (const militar of militares) {
    const ultimoNome = militar.nome
      .trim()
      .split(' ')
      .at(-1)!
      .toLowerCase();

    const senha = `${ultimoNome}${militar.numero}`;
    const password = await bcrypt.hash(senha, 10);

    const user = await prisma.user.create({
      data: {
        name: militar.nome,
        email: `${militar.numero}@tg02080.local`,
        password,
        role: Role.USER,
      },
    });

    const military = await prisma.military.create({
      data: {
        name: militar.nome,
        warName: militar.nome_guerra,
        registration: String(militar.numero).padStart(2, '0'),
        type: militar.tipo,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });
  }

  console.log("Seed concluído.");
  console.log("Login admin: admin@tg.local / senha: 123456");
  console.log("Login usuário: usuario@tg.local / senha: 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
