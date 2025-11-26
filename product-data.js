// products-data.js
// Array de produtos de exemplo — id único, sku, nome, preço, categoria, marca, estoque, imagens, descrição, specs, compatibilidade
const PRODUCTS = [
  {
    id: 1, sku: 'BRK-1234', name: 'Pastilha de Freio Dianteira - MarcaX', price: 129.90, category: 'Freios', brand: 'MarcaX', stock: 24,
    images: ["img/pastilha_freio.jpg"],
    description: 'Pastilha de excelente atrito, uso urbano e rodoviário.',
    specs: {material: 'Cerâmica', warranty: '6 meses'},
    compatibility: ['Fiat Palio', 'Chevrolet Onix', 'Volkswagen Gol']
  },
  {
    id: 2, sku: 'FLT-2001', name: 'Filtro de Óleo HF-2001', price: 49.90, category: 'Filtros', brand: 'FiltroPlus', stock: 80,
    images: ['img/filtro_oleo.png'],
    description: 'Filtro de óleo com alta capacidade de retenção de impurezas.',
    specs: {height: '95mm', diameter: '65mm', warranty: '3 meses'},
    compatibility: ['Mercedes A200', 'Volkswagen Fox']
  },
  {
    id: 3, sku: 'OIL-5W30', name: 'Óleo 5W30 Sintético 1L', price: 79.90, category: 'Óleos', brand: 'AUTOCAR', stock: 160,
    images: ['img/oleo.jpg'],
    description: 'Óleo sintético para maior proteção do motor.',
    specs: {viscosity: '5W-30', spec: 'API SN'},
    compatibility: []
  },
  {
    id: 4, sku: 'SPL-9090', name: 'Vela Iridium V-9090', price: 39.90, category: 'Velas', brand: 'SparkPro', stock: 120,
    images: ['img/vela.png'],
    description: 'Vela com ponta de irídio para ignição eficiente.',
    specs: {gap: '0.9mm', warranty: '6 meses'},
    compatibility: ['Ford Ka', 'Fiat Uno']
  },
  {
    id: 5, sku: 'BAT-AGM45', name: 'Bateria AGM 45Ah', price: 399.00, category: 'Baterias', brand: 'PowerCell', stock: 12,
    images: ['img/bateria.png'],
    description: 'Bateria AGM de alta durabilidade e partida segura.',
    specs: {capacity: '45Ah', voltage: '12V'},
    compatibility: ['Varios modelos compactos']
  },
  {
    id: 6, sku: 'DIS-887', name: 'Disco de Freio Dianteiro', price: 179.90, category: 'Freios', brand: 'BrakeTec', stock: 30,
    images: ['img/disco_freio.png'],
    description: 'Disco ventilado para melhor dissipação de calor.',
    specs: {},
    compatibility: ['Chevrolet Onix','Hyundai HB20']
  },
  {
    id: 7, sku: 'FAR-LED1', name: 'Kit Farol LED 12V', price: 199.90, category: 'Iluminação', brand: 'LightPro', stock: 40,
    images: ['img/kit_farol.png'],
    description: 'Kit de faróis LED com iluminação branca intensa.',
    specs: {},
    compatibility: []
  },
  {
    id: 8, sku: 'AIR-101', name: 'Filtro de Ar Motor', price: 69.90, category: 'Filtros', brand: 'FiltroPlus', stock: 70,
    images: ['img/filtro_ar.png'],
    description: 'Filtro de ar de alta eficiência.',
    specs: {},
    compatibility: ['Fiat Palio','Renault Clio']
  },
  {
    id: 9, sku: 'BELT-EX', name: 'Correia Dentada EX', price: 149.90, category: 'Correias', brand: 'DriveLine', stock: 20,
    images: ['img/correia_dentada.png'],
    description: 'Correia com reforço para maior durabilidade.',
    specs: {},
    compatibility: ['VW Golf','Audi A3']
  },
  {
    id: 10, sku: 'KIT-TRV', name: 'Kit de Reparo Suspensão', price: 249.90, category: 'Suspensão', brand: 'RideSafe', stock: 15,
    images: ['img/kit_suspensao.png'],
    description: 'Kit com buchas e tirantes para manutenção completa.',
    specs: {},
    compatibility: []
  },
  {
    id: 11, sku: 'OIL-10W40', name: 'Óleo Mineral 10W40 1L', price: 39.90, category: 'Óleos', brand: 'LubriMax', stock: 220,
    images: ['img/oleo_mineral.png'],
    description: 'Óleo mineral para motores mais antigos.',
    specs: {viscosity: '10W-40'},
    compatibility: []
  },
  {
    id: 12, sku: 'SPK-200', name: 'Conjunto de Pastilhas Traseiras', price: 139.90, category: 'Freios', brand: 'MarcaX', stock: 26,
    images: ['img/conjunto_pastilhas.png'],
    description: 'Conjunto com sensor de desgaste incluso.',
    specs: {},
    compatibility: []
  }
];

// Export if needed (for module bundlers). In browser global var is enough.
