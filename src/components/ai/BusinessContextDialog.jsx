import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Search, Check, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const BUSINESS_SEGMENTS = [
  // Alimentação
  { value: "acougue", label: "🥩 Açougue" },
  { value: "bar_boteco", label: "🍺 Bar/Boteco" },
  { value: "cafeteria", label: "☕ Cafeteria" },
  { value: "confeitaria_doces", label: "🧁 Confeitaria/Doces" },
  { value: "delivery_comida", label: "🍱 Delivery de Comida" },
  { value: "distribuidora_alimentos", label: "📦 Distribuidora de Alimentos" },
  { value: "food_truck", label: "🚚 Food Truck" },
  { value: "hamburgueria", label: "🍔 Hamburgueria" },
  { value: "lanchonete", label: "🥪 Lanchonete" },
  { value: "marmitaria", label: "🍱 Marmitaria" },
  { value: "mercado_mini", label: "🛒 Mercado/Mini Mercado" },
  { value: "padaria", label: "🥖 Padaria" },
  { value: "pastelaria", label: "🥟 Pastelaria" },
  { value: "pizzaria", label: "🍕 Pizzaria" },
  { value: "restaurante", label: "🍽️ Restaurante" },
  { value: "sorveteria", label: "🍦 Sorveteria" },
  { value: "supermercado", label: "🏪 Supermercado" },
  
  // Saúde e Bem-estar
  { value: "academia_fitness", label: "💪 Academia/Fitness" },
  { value: "acupuntura", label: "💉 Acupuntura" },
  { value: "clinica_fisioterapia", label: "🧘 Clínica de Fisioterapia" },
  { value: "clinica_medica", label: "🏥 Clínica Médica" },
  { value: "clinica_odontologica", label: "🦷 Clínica Odontológica" },
  { value: "clinica_psicologia", label: "🧠 Clínica de Psicologia" },
  { value: "clinica_veterinaria", label: "🐾 Clínica Veterinária" },
  { value: "drogaria_farmacia", label: "💊 Drogaria/Farmácia" },
  { value: "farmacia_manipulacao", label: "💊 Farmácia de Manipulação" },
  { value: "laboratorio_analises", label: "🔬 Laboratório de Análises" },
  { value: "nutricionista", label: "🥗 Nutricionista" },
  { value: "personal_trainer", label: "💪 Personal Trainer" },
  { value: "pilates", label: "🧘 Estúdio de Pilates" },
  
  // Beleza e Estética
  { value: "barbearia", label: "💈 Barbearia" },
  { value: "clinica_estetica", label: "💅 Clínica de Estética" },
  { value: "depilacao", label: "✨ Depilação" },
  { value: "designer_sobrancelhas", label: "✨ Designer de Sobrancelhas" },
  { value: "estetica_automotiva", label: "🚗 Estética Automotiva" },
  { value: "manicure_pedicure", label: "💅 Manicure/Pedicure" },
  { value: "maquiagem_profissional", label: "💄 Maquiagem Profissional" },
  { value: "salao_beleza", label: "💇 Salão de Beleza" },
  { value: "spa", label: "🧖 Spa" },
  
  // Moda e Vestuário
  { value: "alfaiataria", label: "👔 Alfaiataria" },
  { value: "bijuteria_acessorios", label: "💍 Bijuteria/Acessórios" },
  { value: "confeccao_roupas", label: "👗 Confecção de Roupas" },
  { value: "costureira", label: "🪡 Costureira" },
  { value: "joalheria", label: "💎 Joalheria" },
  { value: "lavanderia", label: "🧺 Lavanderia" },
  { value: "loja_calcados", label: "👞 Loja de Calçados" },
  { value: "loja_roupas", label: "👕 Loja de Roupas" },
  { value: "loja_lingerie", label: "👙 Loja de Lingerie" },
  { value: "relojoaria", label: "⌚ Relojoaria" },
  { value: "sapataria", label: "👞 Sapataria" },
  { value: "tinturaria", label: "👔 Tinturaria" },
  
  // Construção e Reformas
  { value: "arquitetura", label: "📐 Arquitetura" },
  { value: "azulejista", label: "🧱 Azulejista" },
  { value: "britagem", label: "⛏️ Britagem" },
  { value: "carpintaria", label: "🪵 Carpintaria" },
  { value: "casa_construcao", label: "🏠 Casa de Construção" },
  { value: "construtora", label: "🏗️ Construtora" },
  { value: "decoracao_interiores", label: "🛋️ Decoração/Interiores" },
  { value: "eletricista", label: "⚡ Eletricista" },
  { value: "encanador_hidraulica", label: "🚰 Encanador/Hidráulica" },
  { value: "engenharia_civil", label: "👷 Engenharia Civil" },
  { value: "gesseiro", label: "🧱 Gesseiro" },
  { value: "instalacao_ar_condicionado", label: "❄️ Instalação de Ar Condicionado" },
  { value: "jardinagem_paisagismo", label: "🌳 Jardinagem/Paisagismo" },
  { value: "marcenaria", label: "🪵 Marcenaria" },
  { value: "marmoraria", label: "⬜ Marmoraria" },
  { value: "pedreiro", label: "🧱 Pedreiro" },
  { value: "pintor_predial", label: "🎨 Pintor Predial" },
  { value: "serralheria", label: "🔨 Serralheria" },
  { value: "tapeçaria", label: "🛋️ Tapeçaria" },
  { value: "vidracaria", label: "🪟 Vidraçaria" },
  
  // Automotivo
  { value: "auto_eletrica", label: "🔌 Auto Elétrica" },
  { value: "auto_pecas", label: "🔧 Auto Peças" },
  { value: "borracharia", label: "🛞 Borracharia" },
  { value: "despachante", label: "📄 Despachante" },
  { value: "estacionamento", label: "🅿️ Estacionamento" },
  { value: "funilaria_pintura", label: "🚗 Funilaria e Pintura" },
  { value: "guincho", label: "🚛 Guincho" },
  { value: "instalacao_insulfilm", label: "🚗 Instalação de Insulfilm" },
  { value: "lava_jato", label: "🚿 Lava Jato" },
  { value: "locadora_veiculos", label: "🚗 Locadora de Veículos" },
  { value: "mecanica_auto", label: "🔧 Mecânica Auto" },
  { value: "revenda_veiculos", label: "🚗 Revenda de Veículos" },
  { value: "som_automotivo", label: "🔊 Som Automotivo" },
  
  // Comércio
  { value: "antiquario", label: "🏺 Antiquário" },
  { value: "casa_racao", label: "🐾 Casa de Ração" },
  { value: "distribuidora", label: "📦 Distribuidora" },
  { value: "eletrodomesticos", label: "🏠 Eletrodomésticos" },
  { value: "eletronica", label: "📱 Eletrônica" },
  { value: "ferragens", label: "🔩 Ferragens" },
  { value: "floricultura", label: "🌸 Floricultura" },
  { value: "importadora", label: "🌐 Importadora" },
  { value: "livraria", label: "📚 Livraria" },
  { value: "loja_1_99", label: "🛍️ Loja 1,99" },
  { value: "loja_artesanato", label: "🎨 Loja de Artesanato" },
  { value: "loja_brinquedos", label: "🧸 Loja de Brinquedos" },
  { value: "loja_departamentos", label: "🏬 Loja de Departamentos" },
  { value: "loja_informatica", label: "💻 Loja de Informática" },
  { value: "loja_materiais_escritorio", label: "📝 Loja de Materiais de Escritório" },
  { value: "loja_moveis", label: "🛏️ Loja de Móveis" },
  { value: "otica", label: "👓 Ótica" },
  { value: "papelaria", label: "📝 Papelaria" },
  { value: "perfumaria", label: "🌺 Perfumaria" },
  { value: "pet_shop", label: "🐕 Pet Shop" },
  { value: "sex_shop", label: "💋 Sex Shop" },
  { value: "tabacaria", label: "🚬 Tabacaria" },
  
  // Serviços Profissionais
  { value: "advocacia", label: "⚖️ Advocacia" },
  { value: "assessoria_empresarial", label: "💼 Assessoria Empresarial" },
  { value: "cartorio_notas", label: "📜 Cartório de Notas" },
  { value: "cartorio_registro", label: "📋 Cartório de Registro" },
  { value: "coaching", label: "🎯 Coaching" },
  { value: "consultoria_financeira", label: "💰 Consultoria Financeira" },
  { value: "consultoria_rh", label: "👥 Consultoria de RH" },
  { value: "contabilidade", label: "📊 Contabilidade" },
  { value: "corretagem_imoveis", label: "🏘️ Corretagem de Imóveis" },
  { value: "corretagem_seguros", label: "🛡️ Corretagem de Seguros" },
  { value: "imobiliaria", label: "🏘️ Imobiliária" },
  { value: "traducao", label: "🌐 Tradução" },
  
  // Educação
  { value: "aulas_idiomas", label: "🗣️ Aulas de Idiomas" },
  { value: "aulas_musica", label: "🎵 Aulas de Música" },
  { value: "aulas_particulares", label: "📚 Aulas Particulares" },
  { value: "autoescola", label: "🚗 Autoescola" },
  { value: "curso_profissionalizante", label: "📚 Curso Profissionalizante" },
  { value: "escola_educacao_infantil", label: "🧒 Escola de Educação Infantil" },
  { value: "escola_ensino_fundamental", label: "📚 Escola de Ensino Fundamental" },
  { value: "escola_ensino_medio", label: "🎓 Escola de Ensino Médio" },
  { value: "faculdade", label: "🎓 Faculdade" },
  
  // Tecnologia
  { value: "assistencia_tecnica_celular", label: "📱 Assistência Técnica de Celular" },
  { value: "assistencia_tecnica_informatica", label: "💻 Assistência Técnica de Informática" },
  { value: "desenvolvimento_software", label: "💻 Desenvolvimento de Software" },
  { value: "desenvolvimento_web", label: "🌐 Desenvolvimento Web" },
  { value: "designer_grafico", label: "🎨 Designer Gráfico" },
  { value: "instalacao_cameras", label: "📹 Instalação de Câmeras" },
  { value: "manutencao_computadores", label: "💻 Manutenção de Computadores" },
  { value: "marketing_digital", label: "📱 Marketing Digital" },
  { value: "seguranca_eletronica", label: "🔒 Segurança Eletrônica" },
  { value: "telefonia_celular", label: "📱 Telefonia/Celular" },
  
  // Eventos e Entretenimento
  { value: "agencia_viagens", label: "✈️ Agência de Viagens" },
  { value: "aluguel_brinquedos_festa", label: "🎈 Aluguel de Brinquedos para Festa" },
  { value: "buffet_eventos", label: "🎉 Buffet/Eventos" },
  { value: "dj", label: "🎧 DJ" },
  { value: "estudio_fotografia", label: "📷 Estúdio de Fotografia" },
  { value: "estudio_tatuagem", label: "🎨 Estúdio de Tatuagem" },
  { value: "filmagem_eventos", label: "🎥 Filmagem de Eventos" },
  { value: "fotografo", label: "📸 Fotógrafo" },
  { value: "producao_eventos", label: "🎭 Produção de Eventos" },
  { value: "salao_festas", label: "🎊 Salão de Festas" },
  
  // Hospedagem
  { value: "airbnb", label: "🏠 Aluguel por Temporada (Airbnb)" },
  { value: "hotel", label: "🏨 Hotel" },
  { value: "motel", label: "🏩 Motel" },
  { value: "pousada", label: "🏡 Pousada" },
  
  // Indústria
  { value: "confeccao_industrial", label: "🏭 Confecção Industrial" },
  { value: "fabrica_alimentos", label: "🏭 Fábrica de Alimentos" },
  { value: "fabrica_moveis", label: "🏭 Fábrica de Móveis" },
  { value: "grafica", label: "🖨️ Gráfica" },
  { value: "industria_metalurgica", label: "🏭 Indústria Metalúrgica" },
  { value: "industria_plasticos", label: "🏭 Indústria de Plásticos" },
  { value: "industria_textil", label: "🏭 Indústria Têxtil" },
  { value: "serigrafia", label: "🖨️ Serigrafia" },
  
  // Agronegócio
  { value: "agropecuaria", label: "🌾 Agropecuária" },
  { value: "apicultura", label: "🐝 Apicultura" },
  { value: "avicultura", label: "🐔 Avicultura" },
  { value: "fazenda", label: "🚜 Fazenda" },
  { value: "hortifruti", label: "🥬 Hortifruti" },
  { value: "piscicultura", label: "🐟 Piscicultura" },
  
  // Transporte e Logística
  { value: "agencia_turismo", label: "✈️ Agência de Turismo" },
  { value: "courrier", label: "📦 Courrier" },
  { value: "entregador_motoboy", label: "🏍️ Entregador/Motoboy" },
  { value: "fretamento", label: "🚌 Fretamento" },
  { value: "motoboy", label: "🏍️ Motoboy" },
  { value: "mudancas", label: "🚚 Mudanças" },
  { value: "taxi", label: "🚕 Taxi" },
  { value: "transporte_cargas", label: "🚚 Transporte de Cargas" },
  { value: "transporte_escolar", label: "🚌 Transporte Escolar" },
  { value: "uber_99", label: "🚗 motorista Uber/99" },
  
  // Serviços Diversos
  { value: "assistencia_tecnica_eletrodomesticos", label: "🔧 Assistência Técnica Eletrodomésticos" },
  { value: "chaveiro", label: "🔑 Chaveiro" },
  { value: "coworking", label: "🖥️ Coworking" },
  { value: "dedetizacao", label: "🐜 Dedetização" },
  { value: "limpeza_domestica", label: "🧹 Limpeza Doméstica" },
  { value: "limpeza_empresarial", label: "🧹 Limpeza Empresarial" },
  { value: "manutencao_predial", label: "🏢 Manutenção Predial" },
  { value: "organizacao_eventos", label: "📋 Organização de Eventos" },
  { value: "reciclagem", label: "♻️ Reciclagem" },
  { value: "seguranca_patrimonial", label: "🛡️ Segurança Patrimonial" },
  
  // Outros
  { value: "banco_financeira", label: "🏦 Banco/Financeira" },
  { value: "casa_cambio", label: "💱 Casa de Câmbio" },
  { value: "cooperativa", label: "🤝 Cooperativa" },
  { value: "ong_associacao", label: "❤️ ONG/Associação" },
  { value: "sindicato", label: "✊ Sindicato" },
  { value: "outros", label: "📦 Outros" },
].sort((a, b) => a.label.localeCompare(b.label));

const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

const BRAZILIAN_CITIES = {
  "AC": ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá", "Feijó"],
  "AL": ["Maceió", "Arapiraca", "Palmeira dos Índios", "Rio Largo", "Penedo", "União dos Palmares"],
  "AP": ["Macapá", "Santana", "Laranjal do Jari", "Oiapoque", "Mazagão"],
  "AM": ["Manaus", "Parintins", "Itacoatiara", "Manacapuru", "Coari", "Tefé", "Tabatinga"],
  "BA": ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Itabuna", "Juazeiro", "Lauro de Freitas", "Ilhéus", "Jequié", "Teixeira de Freitas", "Alagoinhas", "Barreiras", "Paulo Afonso", "Eunápolis", "Simões Filho", "Santo Antônio de Jesus", "Valença", "Candeias"],
  "CE": ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral", "Crato", "Itapipoca", "Maranguape", "Iguatu", "Quixadá", "Canindé", "Pacajus", "Crateús"],
  "DF": ["Brasília", "Taguatinga", "Ceilândia", "Samambaia", "Planaltina", "Águas Claras", "Gama", "Santa Maria", "Sobradinho"],
  "ES": ["Vitória", "Vila Velha", "Serra", "Cariacica", "Viana", "Guarapari", "Cachoeiro de Itapemirim", "Linhares", "São Mateus", "Colatina", "Aracruz"],
  "GO": ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde", "Luziânia", "Águas Lindas de Goiás", "Valparaíso de Goiás", "Trindade", "Formosa", "Novo Gama", "Itumbiara", "Senador Canedo", "Catalão", "Jataí", "Caldas Novas"],
  "MA": ["São Luís", "Imperatriz", "São José de Ribamar", "Timon", "Caxias", "Codó", "Paço do Lumiar", "Açailândia", "Bacabal", "Balsas"],
  "MT": ["Cuiabá", "Várzea Grande", "Rondonópolis", "Sinop", "Tangará da Serra", "Cáceres", "Sorriso", "Lucas do Rio Verde", "Barra do Garças", "Primavera do Leste"],
  "MS": ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Ponta Porã", "Aquidauana", "Nova Andradina", "Maracaju", "Sidrolândia", "Naviraí"],
  "MG": ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Ribeirão das Neves", "Uberaba", "Governador Valadares", "Ipatinga", "Sete Lagoas", "Divinópolis", "Santa Luzia", "Ibirité", "Poços de Caldas", "Patos de Minas", "Teófilo Otoni", "Sabará", "Pouso Alegre", "Barbacena", "Varginha", "Conselheiro Lafaiete", "Araguari", "Itabira", "Passos", "Ubá", "Muriaé", "Alfenas", "Vespasiano", "Araxá"],
  "PA": ["Belém", "Ananindeua", "Santarém", "Marabá", "Castanhal", "Parauapebas", "Itaituba", "Cametá", "Bragança", "Abaetetuba", "Marituba", "Altamira"],
  "PB": ["João Pessoa", "Campina Grande", "Santa Rita", "Patos", "Bayeux", "Sousa", "Cajazeiras", "Guarabira", "Cabedelo", "Monteiro"],
  "PR": ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "São José dos Pinhais", "Foz do Iguaçu", "Colombo", "Guarapuava", "Paranaguá", "Araucária", "Toledo", "Apucarana", "Pinhais", "Campo Largo", "Almirante Tamandaré", "Umuarama", "Piraquara", "Cambé", "Sarandi", "Fazenda Rio Grande", "Paranavaí", "Francisco Beltrão", "Pato Branco", "Cianorte"],
  "PE": ["Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru", "Petrolina", "Paulista", "Cabo de Santo Agostinho", "Camaragibe", "Garanhuns", "Vitória de Santo Antão", "Igarassu", "São Lourenço da Mata", "Abreu e Lima", "Santa Cruz do Capibaribe", "Ipojuca", "Serra Talhada", "Araripina", "Gravatá"],
  "PI": ["Teresina", "Parnaíba", "Picos", "Piripiri", "Floriano", "Campo Maior", "Barras", "São Raimundo Nonato"],
  "RJ": ["Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Niterói", "Belford Roxo", "Campos dos Goytacazes", "São João de Meriti", "Petrópolis", "Volta Redonda", "Magé", "Macaé", "Itaboraí", "Cabo Frio", "Nova Friburgo", "Barra Mansa", "Angra dos Reis", "Mesquita", "Nilópolis", "Teresópolis", "Resende", "Araruama", "Queimados", "Rio das Ostras", "Saquarema", "Barra do Piraí"],
  "RN": ["Natal", "Mossoró", "Parnamirim", "São Gonçalo do Amarante", "Macaíba", "Ceará-Mirim", "Caicó", "Assu", "Currais Novos"],
  "RS": ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria", "Gravataí", "Viamão", "Novo Hamburgo", "São Leopoldo", "Rio Grande", "Alvorada", "Passo Fundo", "Sapucaia do Sul", "Uruguaiana", "Santa Cruz do Sul", "Cachoeirinha", "Bagé", "Bento Gonçalves", "Erechim", "Guaíba", "Cachoeira do Sul", "Santana do Livramento", "Ijuí", "Alegrete"],
  "RO": ["Porto Velho", "Ji-Paraná", "Ariquemes", "Vilhena", "Cacoal", "Jaru", "Rolim de Moura"],
  "RR": ["Boa Vista", "Rorainópolis", "Caracaraí", "Mucajaí", "Pacaraima"],
  "SC": ["Florianópolis", "Joinville", "Blumenau", "São José", "Criciúma", "Chapecó", "Itajaí", "Jaraguá do Sul", "Lages", "Palhoça", "Balneário Camboriú", "Brusque", "Tubarão", "São Bento do Sul", "Caçador", "Camboriú", "Navegantes", "Concórdia", "Rio do Sul", "Araranguá", "Gaspar", "Biguaçu", "Indaial", "Itapema"],
  "SP": ["São Paulo", "Guarulhos", "Campinas", "São Bernardo do Campo", "Santo André", "Osasco", "São José dos Campos", "Ribeirão Preto", "Sorocaba", "Mauá", "São José do Rio Preto", "Mogi das Cruzes", "Santos", "Diadema", "Jundiaí", "Carapicuíba", "Piracicaba", "Bauru", "São Vicente", "Itaquaquecetuba", "Franca", "Guarujá", "Taubaté", "Praia Grande", "Limeira", "Suzano", "Taboão da Serra", "Sumaré", "Barueri", "Embu das Artes", "São Carlos", "Marília", "Indaiatuba", "Cotia", "Americana", "Jacareí", "Araraquara", "Itapevi", "Presidente Prudente", "Hortolândia", "Rio Claro", "Ferraz de Vasconcelos", "Araçatuba", "Itapecerica da Serra", "Francisco Morato", "São Caetano do Sul", "Mogi Guaçu", "Itapetininga", "Franco da Rocha", "Bragança Paulista", "Pindamonhangaba", "Guaratinguetá", "Jaú", "Botucatu", "Atibaia", "Araras", "Cubatão", "Caraguatatuba", "Santana de Parnaíba", "Valinhos", "Sertãozinho", "Votorantim", "Catanduva", "Salto"],
  "SE": ["Aracaju", "Nossa Senhora do Socorro", "Lagarto", "Itabaiana", "São Cristóvão", "Estância", "Tobias Barreto"],
  "TO": ["Palmas", "Araguaína", "Gurupi", "Porto Nacional", "Paraíso do Tocantins", "Colinas do Tocantins"],
};

export default function BusinessContextDialog({ open, onClose, onSave, user }) {
  const [formData, setFormData] = useState({
    business_segment: user?.business_segment || '',
    business_name: user?.business_name || '',
    employee_count: user?.employee_count || '',
    operation_type: user?.operation_type || 'nacional_digital',
    operation_states: user?.operation_states || [],
    operation_cities: user?.operation_cities || [],
    main_challenge: user?.main_challenge || ''
  });

  const [openCombobox, setOpenCombobox] = useState(false);
  const [openStatesCombobox, setOpenStatesCombobox] = useState(false);
  const [openCitiesCombobox, setOpenCitiesCombobox] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const selectedSegment = useMemo(() => {
    return BUSINESS_SEGMENTS.find(s => s.value === formData.business_segment);
  }, [formData.business_segment]);

  // Lista de cidades disponíveis baseada nos estados selecionados
  const availableCities = useMemo(() => {
    if (formData.operation_states.length === 0) return [];
    
    const cities = [];
    formData.operation_states.forEach(stateValue => {
      const stateCities = BRAZILIAN_CITIES[stateValue] || [];
      stateCities.forEach(city => {
        cities.push({
          value: `${city}, ${stateValue}`,
          label: `${city} (${stateValue})`,
          city: city,
          state: stateValue
        });
      });
    });
    
    return cities.sort((a, b) => a.label.localeCompare(b.label));
  }, [formData.operation_states]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleRemoveState = (stateValue) => {
    // Remove o estado
    const newStates = formData.operation_states.filter(s => s !== stateValue);
    
    // Remove cidades desse estado
    const newCities = formData.operation_cities.filter(cityValue => {
      return !cityValue.endsWith(`, ${stateValue}`);
    });
    
    setFormData({
      ...formData,
      operation_states: newStates,
      operation_cities: newCities
    });
  };

  const handleRemoveCity = (cityValue) => {
    setFormData({
      ...formData,
      operation_cities: formData.operation_cities.filter(c => c !== cityValue)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Conte sobre seu negócio
          </DialogTitle>
          <DialogDescription>
            Com essas informações, posso dar conselhos muito mais direcionados e práticos para você!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="business_name">1. Qual o nome do seu negócio? *</Label>
            <Input
              id="business_name"
              placeholder="Ex: Padaria do João, Salão Elegance..."
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_segment">2. Qual o ramo/segmento? *</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between"
                >
                  {selectedSegment ? selectedSegment.label : "Digite ou selecione..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Digite para buscar..." 
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>Nenhum ramo encontrado.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {BUSINESS_SEGMENTS.map((segment) => (
                        <CommandItem
                          key={segment.value}
                          value={segment.label}
                          onSelect={() => {
                            setFormData({ ...formData, business_segment: segment.value });
                            setOpenCombobox(false);
                            setSearchValue('');
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              formData.business_segment === segment.value
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          {segment.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-slate-500">
              {BUSINESS_SEGMENTS.length}+ opções disponíveis - digite para filtrar
            </p>
          </div>

          <div className="space-y-2">
            <Label>3. Quantos funcionários? *</Label>
            <Select
              value={formData.employee_count}
              onValueChange={(value) => setFormData({ ...formData, employee_count: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apenas_eu">Apenas eu (MEI)</SelectItem>
                <SelectItem value="2_a_5">2 a 5 funcionários</SelectItem>
                <SelectItem value="6_a_10">6 a 10 funcionários</SelectItem>
                <SelectItem value="11_a_20">11 a 20 funcionários</SelectItem>
                <SelectItem value="mais_de_20">Mais de 20</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>4. Onde seu negócio atua? *</Label>
            <RadioGroup
              value={formData.operation_type}
              onValueChange={(value) => setFormData({ ...formData, operation_type: value })}
              required
            >
              <div className="flex items-start space-x-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="nacional_digital" id="nacional_digital" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="nacional_digital" className="font-medium cursor-pointer">
                    🌐 Nacional Digital
                  </Label>
                  <p className="text-xs text-slate-500 mt-1">
                    Atuo online, sem necessidade de presença física (e-commerce, serviços digitais)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="nacional_fisica" id="nacional_fisica" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="nacional_fisica" className="font-medium cursor-pointer">
                    🚚 Nacional Físico
                  </Label>
                  <p className="text-xs text-slate-500 mt-1">
                    Tenho estrutura física e/ou logística em todo o Brasil
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="regional" id="regional" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="regional" className="font-medium cursor-pointer">
                    📍 Regional
                  </Label>
                  <p className="text-xs text-slate-500 mt-1">
                    Atuo em estados e/ou cidades específicas
                  </p>
                </div>
              </div>
            </RadioGroup>

            {formData.operation_type === 'regional' && (
              <div className="space-y-4 pl-6 mt-4 border-l-2 border-blue-200">
                {/* Estados */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Estados onde atua:</Label>
                  <Popover open={openStatesCombobox} onOpenChange={setOpenStatesCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        Selecionar estados
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Digite para buscar..." />
                        <CommandList>
                          <CommandEmpty>Nenhum estado encontrado.</CommandEmpty>
                          <CommandGroup className="max-h-48 overflow-auto">
                            {BRAZILIAN_STATES.map((state) => (
                              <CommandItem
                                key={state.value}
                                value={state.label}
                                onSelect={() => {
                                  if (!formData.operation_states.includes(state.value)) {
                                    setFormData({
                                      ...formData,
                                      operation_states: [...formData.operation_states, state.value]
                                    });
                                  }
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    formData.operation_states.includes(state.value)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                {state.label} ({state.value})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {formData.operation_states.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.operation_states.map((stateValue) => {
                        const state = BRAZILIAN_STATES.find(s => s.value === stateValue);
                        return (
                          <Badge key={stateValue} variant="secondary" className="gap-1">
                            {state?.label}
                            <button
                              type="button"
                              onClick={() => handleRemoveState(stateValue)}
                              className="hover:bg-slate-300 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Cidades */}
                {formData.operation_states.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cidades específicas (opcional):</Label>
                    <Popover open={openCitiesCombobox} onOpenChange={setOpenCitiesCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                          disabled={availableCities.length === 0}
                        >
                          Selecionar cidades
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Digite para buscar cidade..." />
                          <CommandList>
                            <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {availableCities.map((city) => (
                                <CommandItem
                                  key={city.value}
                                  value={city.label}
                                  onSelect={() => {
                                    if (!formData.operation_cities.includes(city.value)) {
                                      setFormData({
                                        ...formData,
                                        operation_cities: [...formData.operation_cities, city.value]
                                      });
                                    }
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      formData.operation_cities.includes(city.value)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                  {city.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-slate-500">
                      {availableCities.length} cidades disponíveis nos estados selecionados
                    </p>
                    
                    {formData.operation_cities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.operation_cities.map((cityValue) => (
                          <Badge key={cityValue} variant="secondary" className="gap-1">
                            {cityValue}
                            <button
                              type="button"
                              onClick={() => handleRemoveCity(cityValue)}
                              className="hover:bg-slate-300 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="main_challenge">5. Qual seu maior desafio hoje? (Opcional)</Label>
            <Textarea
              id="main_challenge"
              placeholder="Ex: Aumentar vendas, reduzir custos, organizar o financeiro, contratar equipe..."
              value={formData.main_challenge}
              onChange={(e) => setFormData({ ...formData, main_challenge: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-slate-500">
              Isso me ajuda a focar nas suas prioridades!
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Depois
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Salvar e Começar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}