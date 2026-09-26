// 仅供内置病例的界面预设使用，不读取图像、不从模型等级推导观察。
export function makeMorphologyExample(values) {
  if (!values) return []
  const [uniformity, cytoplasm, zona, fragmentation] = values
  return [
    { id: 'C01', observation: uniformity },
    { id: 'C02', observation: cytoplasm },
    { id: 'C04', observation: zona },
    { id: 'C08', observation: '碎片率', value: fragmentation, unit: '%' },
  ].map(item => ({
    status: 'recorded',
    value: null,
    unit: null,
    source: 'demo',
    method: '界面演示预设，非图像测量',
    region: null,
    ...item,
  }))
}
