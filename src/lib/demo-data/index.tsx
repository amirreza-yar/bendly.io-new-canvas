type DemoMaterial = {
  name: string;
  id: number;
  variant_type: 'color' | 'thickness';
  variants: {
    id: number;
    label: string;
    value: string | number;
  }[];
};

export const materials: DemoMaterial[] = [
  {
    name: 'Pre-painted steel',
    id: 1,
    variant_type: 'color',
    variants: [
      { id: 1, label: 'Monument', value: '#504A4B' },
      { id: 2, label: 'Surfmist', value: '#ECE7E1' },
      { id: 3, label: 'Shale Grey', value: '#7D7D7D' },
      { id: 4, label: 'Woodland Grey', value: '#5C6A6A' },
      { id: 5, label: 'Manor Red', value: '#8B3A3A' },
      { id: 6, label: 'Paperbark', value: '#D2C6B6' },
      { id: 7, label: 'Basalt', value: '#2F353B' },
      { id: 8, label: 'Bluegum', value: '#1B4D6A' },
      { id: 9, label: 'Cottage Green', value: '#596E57' },
      { id: 10, label: 'Deep Ocean', value: '#002E4D' },
    ],
  },
  {
    name: 'Aluminium',
    id: 2,
    variant_type: 'color',
    variants: [
      { id: 11, label: 'Matte Black', value: '#1C1C1C' },
      { id: 12, label: 'White', value: '#F5F5F5' },
      { id: 13, label: 'Silver Metallic', value: '#C0C0C0' },
      { id: 14, label: 'Bronze', value: '#CD7F32' },
      { id: 15, label: 'Champagne', value: '#F7E7CE' },
      { id: 16, label: 'Copper', value: '#B87333' },
      { id: 17, label: 'Charcoal', value: '#36454F' },
      { id: 18, label: 'Heritage Red', value: '#7C0A02' },
      { id: 19, label: 'Cream', value: '#FFFDD0' },
      { id: 20, label: 'Bluegum', value: '#1B4D6A' },
    ],
  },
  {
    name: 'PVC-coated steel',
    id: 3,
    variant_type: 'color',
    variants: [
      { id: 21, label: 'Black', value: '#000000' },
      { id: 22, label: 'White', value: '#F5F5F5' },
      { id: 23, label: 'Dark Brown', value: '#4B3621' },
      { id: 24, label: 'Light Grey', value: '#D3D3D3' },
      { id: 25, label: 'Green', value: '#008000' },
    ],
  },
  {
    name: 'Anodised aluminium',
    id: 4,
    variant_type: 'color',
    variants: [
      { id: 26, label: 'Natural Silver', value: '#C0C0C0' },
      { id: 27, label: 'Champagne', value: '#F7E7CE' },
      { id: 28, label: 'Bronze', value: '#CD7F32' },
      { id: 29, label: 'Gold', value: '#FFD700' },
      { id: 30, label: 'Black', value: '#000000' },
    ],
  },
  {
    name: 'Copper',
    id: 5,
    variant_type: 'color',
    variants: [
      { id: 31, label: 'Natural Copper', value: '#B87333' },
      { id: 32, label: 'Brown Patina', value: '#5C4033' },
      { id: 33, label: 'Green Patina', value: '#56806F' },
      { id: 34, label: 'Anthra', value: '#3B3B3B' },
    ],
  },
  {
    name: 'Zinc',
    id: 6,
    variant_type: 'color',
    variants: [
      { id: 35, label: 'Natural Grey', value: '#7D7D7D' },
      { id: 36, label: 'Quartz-Zinc', value: '#A9A9A9' },
      { id: 37, label: 'Anthra-Zinc', value: '#3B3B3B' },
    ],
  },

  // Materials that have thickness options but no colors
  {
    name: 'Stainless steel',
    id: 7,
    variant_type: 'thickness',
    variants: [
      { id: 38, label: 'SS304-05', value: 0.5 },
      { id: 39, label: 'SS304-08', value: 0.8 },
      { id: 40, label: 'SS304-10', value: 1.0 },
      { id: 41, label: 'SS316L-05', value: 0.5 },
      { id: 42, label: 'SS316L-10', value: 1.0 },
      { id: 43, label: 'SS316L-15', value: 1.5 },
    ],
  },
  {
    name: 'Galvanised steel',
    id: 8,
    variant_type: 'thickness',
    variants: [
      { id: 44, label: 'GS-04', value: 0.4 },
      { id: 45, label: 'GS-05', value: 0.5 },
      { id: 46, label: 'GS-06', value: 0.6 },
    ],
  },
  {
    name: 'Aluminium (unpainted)',
    id: 9,
    variant_type: 'thickness',
    variants: [
      { id: 47, label: 'AL-10', value: 1.0 },
      { id: 48, label: 'AL-15', value: 1.5 },
      { id: 49, label: 'AL-20', value: 2.0 },
    ],
  },
];
