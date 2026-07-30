'use strict';

const INSTITUTION_EN = {
    'Argonne Nalionrd Laboratory': 'Argonne National Laboratory',
    'Bell Labl': 'Bell Labs',
    'Helsinki University of Technolog': 'Helsinki University of Technology',
    'Northeastern Universit': 'Northeastern University',
    'University of Delawar': 'University of Delaware',
    'University of Munic': 'University of Munich',
    'University of Sienna, Hong Kong Baptist University, University of Wollongong':
        'University of Siena, Hong Kong Baptist University, University of Wollongong',
    'University of Stanford, Stanford Research Institute': 'Stanford University, Stanford Research Institute',
    'Stanford University,Tsinghua University, NVIDIA': 'Stanford University, Tsinghua University, NVIDIA',
    'University of Montreal,Jacobs University, University of Maine, Google':
        'University of Montreal, Jacobs University, University of Maine, Google',
    'Jacobs University Bremen, University of Montreal, Stanford University, University of Toronto':
        'Jacobs University Bremen, University of Montreal, Stanford University, University of Toronto',
    'indico Research , Facebook': 'indico Research, Facebook',
    'UNC Chapel Hill, Zoox , Google, University of Michigan': 'UNC Chapel Hill, Zoox, Google, University of Michigan'
};

const INSTITUTION_ZH = {
    'AT&T Labs': 'AT&T 实验室',
    'AT&T Labs, University College London': 'AT&T 实验室、伦敦大学学院',
    'Argonne Nalionrd Laboratory': '阿贡国家实验室',
    'Argonne National Laboratory': '阿贡国家实验室',
    'Bell Lab': '贝尔实验室',
    'Bell Lab, MIT': '贝尔实验室、麻省理工学院',
    'Bell Labl': '贝尔实验室',
    'Bell Labs, UC Berkeley': '贝尔实验室、加州大学伯克利分校',
    CMU: '卡内基梅隆大学',
    'California Institute of Technology': '加州理工学院',
    'Carnegie Mellon University': '卡内基梅隆大学',
    'Cornell NYC Tech, Toyota Technological Institute, Facebook, Microsoft, Brown University, California Institute of Technology, University of California at Irvine':
        '康奈尔纽约科技校区、丰田工业大学芝加哥分校、Facebook、Microsoft、布朗大学、加州理工学院、加州大学欧文分校',
    'Cornell University': '康奈尔大学',
    'Cornell University, Tsinghua University, Facebook AI Research': '康奈尔大学、清华大学、Facebook 人工智能研究院',
    'Courant Institute of Mathematical Sciences, Facebook': '纽约大学柯朗数学科学研究所、Facebook',
    DeepMind: 'DeepMind',
    'DeepMind, University of Montreal': 'DeepMind、蒙特利尔大学',
    'ETH Zurich': '苏黎世联邦理工学院',
    Facebook: 'Facebook',
    'Facebook, Cornell University': 'Facebook、康奈尔大学',
    'GTE Laboratories Incorporated': 'GTE 实验室',
    Google: 'Google',
    'Google DeepMind': 'Google DeepMind',
    'Google, University of Toronto': 'Google、多伦多大学',
    'Helsinki University of Technolog': '赫尔辛基理工大学',
    IBM: 'IBM',
    INRIA: '法国国家信息与自动化研究所（INRIA）',
    'Institute of Control Sciences Moscow': '莫斯科控制科学研究所',
    'Jacobs University Bremen, University of Montreal, Stanford University, University of Toronto':
        '不来梅雅各布大学、蒙特利尔大学、斯坦福大学、多伦多大学',
    "King's College, University of Edinburgh": '剑桥大学国王学院、爱丁堡大学',
    'Kyushu University, UC San Diego, CMU': '九州大学、加州大学圣迭戈分校、卡内基梅隆大学',
    MCC: '微电子与计算机技术公司（MCC）',
    MIT: '麻省理工学院',
    'MIT, University of Pennsylvania': '麻省理工学院、宾夕法尼亚大学',
    'Manchester University': '曼彻斯特大学',
    'Max Planck Institute for Biological Cybernetics': '马克斯·普朗克生物控制论研究所',
    'Microsoft Research': '微软研究院',
    'Microsoft Research (Asia)': '微软亚洲研究院',
    'Microsoft Research Asia, University of Science and Technology of China, Xian Jiaotong University, Tsinghua University':
        '微软亚洲研究院、中国科学技术大学、西安交通大学、清华大学',
    'Microsoft, Peking University': 'Microsoft、北京大学',
    'Momenta, University of Oxford': 'Momenta、牛津大学',
    'NHK Broadcasting Science Research Laboratories': '日本放送协会广播科学研究实验室',
    'NHK Broadcasting Science Research Laboratories, University of Montreal':
        '日本放送协会广播科学研究实验室、蒙特利尔大学',
    NVIDIA: 'NVIDIA',
    'National Research Development Corporation': '英国国家研究开发公司',
    'New South Wales Institute of Technology': '新南威尔士理工学院',
    'Northeastern Universit': '东北大学',
    OpenAI: 'OpenAI',
    'OpenAI, University of Toronto': 'OpenAI、多伦多大学',
    'Princeton University': '普林斯顿大学',
    'Princeton University, Stanford University, University of Michigan, MIT, UNC Chapel Hill':
        '普林斯顿大学、斯坦福大学、密歇根大学、麻省理工学院、北卡罗来纳大学教堂山分校',
    'Rensselaer Polytechnic Institute, Princeton University, New York University':
        '伦斯勒理工学院、普林斯顿大学、纽约大学',
    'Stanford University': '斯坦福大学',
    'Stanford University, UC Berkeley': '斯坦福大学、加州大学伯克利分校',
    'Stanford University,Tsinghua University, NVIDIA': '斯坦福大学、清华大学、NVIDIA',
    'Technical University of Munich, IDSIA': '慕尼黑工业大学、瑞士人工智能实验室（IDSIA）',
    'Tilburg University, University of Toronto': '蒂尔堡大学、多伦多大学',
    'UC Berkeley': '加州大学伯克利分校',
    'UC Berkeley, Stanford University': '加州大学伯克利分校、斯坦福大学',
    'UNC Chapel Hill, Zoox , Google, University of Michigan': '北卡罗来纳大学教堂山分校、Zoox、Google、密歇根大学',
    'University of Alberta': '阿尔伯塔大学',
    'University of Amsterdam': '阿姆斯特丹大学',
    'University of British Columbia': '不列颠哥伦比亚大学',
    'University of California, Los Angeles': '加州大学洛杉矶分校',
    'University of Cambridge': '剑桥大学',
    'University of Cambridge, Montreal Institute for Learning Algorithms': '剑桥大学、蒙特利尔学习算法研究所（MILA）',
    'University of Delawar': '特拉华大学',
    'University of Edinburgh': '爱丁堡大学',
    'University of Freiburg': '弗赖堡大学',
    'University of Illinois at Chicago': '伊利诺伊大学芝加哥分校',
    'University of Massachusetts, Amherst': '马萨诸塞大学阿默斯特分校',
    'University of Michigan, Ann Arbor': '密歇根大学安娜堡分校',
    'University of Montreal': '蒙特利尔大学',
    'University of Montreal, Yahoo': '蒙特利尔大学、Yahoo',
    'University of Montreal,Jacobs University, University of Maine, Google':
        '蒙特利尔大学、雅各布大学、缅因大学、Google',
    'University of Munic': '慕尼黑大学',
    'University of Oxford': '牛津大学',
    'University of Pennsylvania, U.C. Berkeley, Hebrew University':
        '宾夕法尼亚大学、加州大学伯克利分校、耶路撒冷希伯来大学',
    'University of Sienna, Hong Kong Baptist University, University of Wollongong':
        '锡耶纳大学、香港浸会大学、伍伦贡大学',
    'University of Stanford, Stanford Research Institute': '斯坦福大学、斯坦福研究院',
    'University of Toronto': '多伦多大学',
    'University of Toronto, National University of Singapore': '多伦多大学、新加坡国立大学',
    'University of Washington': '华盛顿大学',
    'University of Washington, Allen Institute for AI, Facebook AI Research':
        '华盛顿大学、艾伦人工智能研究所、Facebook 人工智能研究院',
    'indico Research , Facebook': 'indico 研究院、Facebook'
};

const COUNTRY_EN = {
    Australia: 'Australia',
    Canada: 'Canada',
    'Canada, Germany, France, USA': 'Canada, Germany, France, United States',
    'Canada, Singapore': 'Canada, Singapore',
    'Canada, USA': 'Canada, United States',
    China: 'China',
    'China, UK': 'China, United Kingdom',
    Finland: 'Finland',
    France: 'France',
    Germany: 'Germany',
    'Germany, Switzerland': 'Germany, Switzerland',
    'Germany,Canada,USA': 'Germany, Canada, United States',
    'Italy, China, Australia': 'Italy, China, Australia',
    Japan: 'Japan',
    'Japan, Canada': 'Japan, Canada',
    'Japan, USA': 'Japan, United States',
    Netherlands: 'Netherlands',
    'Netherlands, Canada': 'Netherlands, Canada',
    Russia: 'Russia',
    Switzerland: 'Switzerland',
    UK: 'United Kingdom',
    'UK, Canada': 'United Kingdom, Canada',
    'UK, USA': 'United Kingdom, United States',
    USA: 'United States',
    'USA, Canada': 'United States, Canada',
    'USA, China': 'United States, China',
    'USA, Israel': 'United States, Israel',
    'USA, UK': 'United States, United Kingdom'
};

const COUNTRY_ZH = {
    Australia: '澳大利亚',
    Canada: '加拿大',
    'Canada, Germany, France, USA': '加拿大、德国、法国、美国',
    'Canada, Singapore': '加拿大、新加坡',
    'Canada, USA': '加拿大、美国',
    China: '中国',
    'China, UK': '中国、英国',
    Finland: '芬兰',
    France: '法国',
    Germany: '德国',
    'Germany, Switzerland': '德国、瑞士',
    'Germany,Canada,USA': '德国、加拿大、美国',
    'Italy, China, Australia': '意大利、中国、澳大利亚',
    Japan: '日本',
    'Japan, Canada': '日本、加拿大',
    'Japan, USA': '日本、美国',
    Netherlands: '荷兰',
    'Netherlands, Canada': '荷兰、加拿大',
    Russia: '俄罗斯',
    Switzerland: '瑞士',
    UK: '英国',
    'UK, Canada': '英国、加拿大',
    'UK, USA': '英国、美国',
    USA: '美国',
    'USA, Canada': '美国、加拿大',
    'USA, China': '美国、中国',
    'USA, Israel': '美国、以色列',
    'USA, UK': '美国、英国'
};

function getCanonicalLocation(item) {
    const institution = String(item && item.institution ? item.institution : '').trim();
    const country = String(item && item.country ? item.country : '').trim();
    if (!INSTITUTION_ZH[institution]) throw new Error(`Missing Chinese institution mapping: ${institution}`);
    if (!COUNTRY_EN[country] || !COUNTRY_ZH[country]) throw new Error(`Missing country mapping: ${country}`);
    return {
        place: {
            en: INSTITUTION_EN[institution] || institution,
            zh: INSTITUTION_ZH[institution]
        },
        country: {
            en: COUNTRY_EN[country],
            zh: COUNTRY_ZH[country]
        }
    };
}

function localized(value, locale) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return String(value[locale] || '');
}

module.exports = {
    getCanonicalLocation,
    localized
};
