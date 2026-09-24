import { Country, University, Deadline } from './types';

const createUni = (
  id: string, 
  name: string, 
  location: string, 
  country: string, 
  rank: number, 
  diff: 'Easy' | 'Medium' | 'Hard',
  data: {
    gpa: string,
    ielts: string,
    test: string,
    other: string,
    alumni: string[],
    tuition: string,
    lang?: string,
    website: string,
    image: string
  }
): University => ({
  id,
  name,
  location,
  ranking: rank,
  difficulty: diff,
  image: data.image,
  website: data.website,
  description: `${name} is a globally recognized institution in ${location}, known for its rigorous academic standards and significant contributions to research and industry.`,
  essayFacts: [
    `Ranked #${rank} globally, ${name} specifically prioritizes ${data.other} in international candidates.`,
    `Successful applicants usually exceed the ${data.test} threshold and show deep engagement with ${data.other}.`,
    `Join a legacy of excellence alongside alumni like ${data.alumni[0]} and ${data.alumni[1]}.`
  ],
  admissionRequirements: {
    gpa: data.gpa,
    sat: data.test,
    ielts: data.ielts,
    toefl: "90-110 (Required if IELTS is missing)",
    extracurriculars: ["Leadership", "Community Service", "Subject Olympiads", "Research Projects"],
    valuedSkills: data.other
  },
  scholarships: ["University Presidential Scholarship (Full)", "Global Excellence Award", "Ministry of Education Grant"],
  alumni: data.alumni,
  costs: {
    tuition: data.tuition,
    accommodation: ['Singapore', 'UAE', 'Japan', 'Korea'].includes(country) ? "$800 - $1,500 / month" : "$200 - $500 / month",
    transport: "$50 - $120 / month",
    food: "$200 - $400 / month"
  },
  language: data.lang || (['Singapore', 'UAE', 'India', 'Philippines', 'Malaysia'].includes(country) ? 'English' : 'Bilingual (English/Local)'),
  majorFields: ["Engineering & IT", "Business & Finance", "Natural Sciences", "Social Sciences"]
});

export const ASIA_COUNTRIES: Country[] = [
  { id: 'china', name: 'China', flag: '🇨🇳', difficultyLabel: 'Very Hard (Heavy)', description: 'Academic powerhouse with world-class technical institutes.', universities: [
    createUni('cn_thu', 'Tsinghua University', 'Beijing', 'China', 12, 'Hard', { gpa: "3.9", ielts: "7.0", test: "SAT 1520+", other: "Personal Statement", alumni: ["Xi Jinping", "Chen-Ning Yang"], tuition: "$5,000 / yr", website: "https://www.tsinghua.edu.cn/en/", image: "https://i0.wp.com/olachina.org/wp-content/uploads/2024/12/Tsinghua-University-1.jpeg?fit=2500%2C1380&ssl=1" }),
    createUni('cn_pku', 'Peking University', 'Beijing', 'China', 17, 'Hard', { gpa: "3.9", ielts: "7.0", test: "SAT 1500+", other: "Research Proposal", alumni: ["Li Keqiang", "Tu Youyou"], tuition: "$4,500 / yr", website: "https://english.pku.edu.cn/", image: "https://techportal.in/wp-content/uploads/2023/10/peking-university-1695573947-768x432.jpg" }),
    createUni('cn_fdu', 'Fudan University', 'Shanghai', 'China', 50, 'Hard', { gpa: "3.8", ielts: "6.5", test: "SAT 1450+", other: "Entrance Interview", alumni: ["Guo Guangchang", "Lu Guanqiu"], tuition: "$4,200 / yr", website: "https://www.fudan.edu.cn/en/", image: "https://allterra.ru/upload/cssinliner_webp/iblock/039/y0drkpknjo7q838tr0mt4q4emc67th5f/Fudan_University_4.webp" }),
    createUni('cn_zju', 'Zhejiang University', 'Hangzhou', 'China', 42, 'Hard', { gpa: "3.7", ielts: "6.5", test: "SAT 1400+", other: "Portfolio", alumni: ["Shiing-Shen Chern", "Pan Yunhe"], tuition: "$4,000 / yr", website: "https://www.zju.edu.cn/english/", image: "https://www.riaoverseas.com/wp-content/uploads/2021/08/Zhejiang-University.jpg" }),
    createUni('cn_sjt', 'Shanghai Jiao Tong', 'Shanghai', 'China', 46, 'Hard', { gpa: "3.7", ielts: "6.5", test: "SAT 1420+", other: "Activity Honors", alumni: ["Jiang Zemin", "Qian Xuesen"], tuition: "$4,300 / yr", website: "https://en.sjtu.edu.cn/", image: "https://smapse.com/storage/2022/03/shanghai-jiao-tong-university-school-of-medicine-smapse-1.png" }),
  ]},
  { id: 'korea', name: 'South Korea', flag: '🇰🇷', difficultyLabel: 'Very Hard (Heavy)', description: 'Technological innovator with the elite SKY trio.', universities: [
    createUni('kr_snu', 'Seoul National University', 'Seoul', 'Korea', 41, 'Hard', { gpa: "3.8", ielts: "7.0", test: "SAT 1500+", other: "Global Vision", alumni: ["Ban Ki-moon", "Bang Si-hyuk"], tuition: "$6,500 / yr", website: "https://en.snu.ac.kr/", image: "https://dreamhigh.info/wp-content/uploads/2025/06/img_20150325_001.jpg" }),
    createUni('kr_kai', 'KAIST', 'Daejeon', 'Korea', 56, 'Hard', { gpa: "3.8", ielts: "6.5", test: "SAT Math 780", other: "STEM Innovation", alumni: ["Yi So-yeon", "Lee Suk-chae"], tuition: "$7,000 / yr", website: "https://www.kaist.ac.kr/en/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS7zs3NpgV5kJNO-4sxPGYhSM5XtenUM2bTQw&s" }),
    createUni('kr_yon', 'Yonsei University', 'Seoul', 'Korea', 76, 'Hard', { gpa: "3.7", ielts: "6.5", test: "SAT 1450+", other: "Leadership Experience", alumni: ["Bong Joon-ho", "Han Kang"], tuition: "$8,000 / yr", website: "https://www.yonsei.ac.kr/en_sc/", image: "https://www.ciee.org/sites/default/files/styles/650h/public/blog/2025-03/yonsei-university.jpg?itok=xvASrVC4" }),
    createUni('kr_kor', 'Korea University', 'Seoul', 'Korea', 79, 'Hard', { gpa: "3.7", ielts: "6.5", test: "SAT 1450+", other: "Social Resilience", alumni: ["Lee Myung-bak", "Kim Yuna"], tuition: "$8,200 / yr", website: "https://www.korea.edu/", image: "https://allterra.ru/upload/resize_cache/webp/iblock/996/nrzjqadpy81mau2emgeyln2rm3il75c8/Korea_University_02.webp" }),
    createUni('kr_han', 'Hanyang University', 'Seoul', 'Korea', 156, 'Medium', { gpa: "3.5", ielts: "6.0", test: "SAT Optional", other: "Practical Skills", alumni: ["Chung Mong-koo", "Lee Young-ae"], tuition: "$7,500 / yr", website: "https://www.hanyang.ac.kr/web/eng", image: "https://www.studyabroadfoundation.org/sites/default/files/2024-12/Hanyang%20University%20HYU_%20%20%285%29-3237x2162-1496500.jpg" }),
  ]},
  { id: 'japan', name: 'Japan', flag: '🇯🇵', difficultyLabel: 'Hard (Heavy)', description: 'Rigorous research and meticulously high standards.', universities: [
    createUni('jp_utk', 'University of Tokyo', 'Tokyo', 'Japan', 28, 'Hard', { gpa: "3.9", ielts: "7.5", test: "SAT 1520+", other: "Cultural Adaptability", alumni: ["Shinzo Abe", "Kenzaburo Oe"], tuition: "$5,500 / yr", website: "https://www.u-tokyo.ac.jp/en/", image: "https://cdn.britannica.com/52/124752-050-C6AA6622/Yasuda-Auditorium-University-of-Tokyo.jpg" }),
    createUni('jp_kyo', 'Kyoto University', 'Kyoto', 'Japan', 46, 'Hard', { gpa: "3.8", ielts: "7.0", test: "SAT 1500+", other: "Critical Thinking", alumni: ["Hideki Yukawa", "Shinya Yamanaka"], tuition: "$5,300 / yr", website: "https://www.kyoto-u.ac.jp/en", image: "https://stubard.com/wp-content/uploads/2024/11/Kyoto-University-1200x812.jpg" }),
    createUni('jp_tit', 'Tokyo Tech', 'Tokyo', 'Japan', 91, 'Hard', { gpa: "3.7", ielts: "6.5", test: "SAT 1450+", other: "Technical Vision", alumni: ["Satoru Iwata", "Hideki Shirakawa"], tuition: "$5,800 / yr", website: "https://www.titech.ac.jp/english", image: "https://www.titech.ac.jp/english/admissions/img/calendar-pic-spring02.jpg" }),
    createUni('jp_osa', 'Osaka University', 'Osaka', 'Japan', 80, 'Hard', { gpa: "3.7", ielts: "6.5", test: "SAT 1420+", other: "Analytical Prowess", alumni: ["Akio Morita", "Osamu Tezuka"], tuition: "$5,400 / yr", website: "https://www.osaka-u.ac.jp/en", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQueOvNTox4M7RT8PQSoMf79pgKZpI_3pB2uw&s" }),
    createUni('jp_was', 'Waseda University', 'Tokyo', 'Japan', 180, 'Medium', { gpa: "3.6", ielts: "6.5", test: "SAT 1400+", other: "Community Impact", alumni: ["Haruki Murakami", "Tadashi Yanai"], tuition: "$12,000 / yr", website: "https://www.waseda.jp/top/en", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvnKgRvg2Z2LjYj_0vImSTQ47w7SLIPB9AXA&s" }),
  ]},
  { id: 'singapore', name: 'Singapore', flag: '🇸🇬', difficultyLabel: 'Hard', description: 'World-leading education hub with intense competition.', universities: [
    createUni('sg_nus', 'National University of Singapore', 'Singapore', 'Singapore', 8, 'Hard', { gpa: "3.95", ielts: "7.5", test: "SAT 1550+", other: "Global Leadership", alumni: ["Lee Kuan Yew", "Halimah Yacob"], tuition: "$22,000 / yr", website: "https://www.nus.edu.sg/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc-A7p9uyK7MuSYzsyJ6s6QSplip1_oMI1ag&s" }),
    createUni('sg_ntu', 'Nanyang Tech University', 'Singapore', 'Singapore', 15, 'Hard', { gpa: "3.9", ielts: "7.0", test: "SAT 1520+", other: "Interdisciplinary Research", alumni: ["Stefanie Sun", "Anil K. Jain"], tuition: "$21,000 / yr", website: "https://www.ntu.edu.sg/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTk33u106ce6SCBr31u5yBKcD44I6zcUFpDnQ&s" }),
    createUni('sg_smu', 'Singapore Management University', 'Singapore', 'Singapore', 450, 'Medium', { gpa: "3.8", ielts: "7.0", test: "SAT 1480+", other: "Business Strategy", alumni: ["Pritam Singh", "Rebecca Lim"], tuition: "$19,500 / yr", website: "https://www.smu.edu.sg/", image: "https://stubard.com/wp-content/uploads/2024/11/Singapore-Management-University-1.jpg" }),
    createUni('sg_sut', 'Singapore University of Technology', 'Singapore', 'Singapore', 500, 'Medium', { gpa: "3.7", ielts: "6.5", test: "Portfolio", other: "Design Vision", alumni: ["Min-Liang Tan", "Global Design Leads"], tuition: "$18,000 / yr", website: "https://www.sutd.edu.sg/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRADx5SYFLBL-ofFzg8cxs_D0A9_QntsJxkJQ&s" }),
    createUni('sg_yal', 'Yale-NUS College', 'Singapore', 'Singapore', 50, 'Hard', { gpa: "3.9", ielts: "7.5", test: "SAT 1540+", other: "Liberal Arts Inquiry", alumni: ["Rhodes Scholars", "Policy Analysts"], tuition: "$25,000 / yr", website: "https://www.yale-nus.edu.sg/", image: "https://ydn-cdn.yaledailynews.com/media/3372bad5cc685e13.jpg" }),
  ]},
  { id: 'kazakhstan', name: 'Kazakhstan', flag: '🇰🇿', difficultyLabel: 'Moderate', description: 'Central Asia\'s leading educational destination.', universities: [
    createUni('kz_nu', 'Nazarbayev University', 'Astana', 'Kazakhstan', 501, 'Hard', { gpa: "3.7", ielts: "7.0", test: "SAT 1380+", other: "Technical Research", alumni: ["Astana Hub Founders", "Innovators"], tuition: "$0 / yr (Full Scholarship)", lang: "English", website: "https://nu.edu.kz/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStAYZmzno9ooNNACEKe-9Ps5QyK3rNZmyriQ&s" }),
    createUni('kz_knu', 'Al-Farabi Kazakh National', 'Almaty', 'Kazakhstan', 200, 'Medium', { gpa: "3.4", ielts: "5.5", test: "UNT 120+", other: "Cultural Heritage", alumni: ["K.Tokayev", "O.Suleimenov"], tuition: "$3,000 / yr", website: "https://www.kaznu.kz/en", image: "https://kaznpu.kz/docs/smi/30.6.2018.1.jpg" }),
    createUni('kz_enu', 'L.N. Gumilyov Eurasian', 'Astana', 'Kazakhstan', 300, 'Medium', { gpa: "3.3", ielts: "5.5", test: "UNT 110+", other: "International Relations", alumni: ["Diplomats", "Public Servants"], tuition: "$2,800 / yr", website: "https://www.enu.kz/en", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0vbyLg2bXhaK0poHMh_MFP7cO1mA_w1txGQ&s" }),
    createUni('kz_kbt', 'KBTU', 'Almaty', 'Kazakhstan', 600, 'Medium', { gpa: "3.5", ielts: "6.0", test: "Math/Physics", other: "Industry Focus", alumni: ["T.Kantayev", "Visionaries"], tuition: "$4,500 / yr", website: "https://www.kbtu.kz/en", image: "https://avatars.mds.yandex.net/get-altay/11373142/2a000001907d3f2826abad9844c4e834ae5f/L_height" }),
    createUni('kz_sat', 'Satbayev University', 'Almaty', 'Kazakhstan', 800, 'Easy', { gpa: "3.2", ielts: "5.5", test: "UNT 100+", other: "Engineering Skills", alumni: ["K.Satbayev", "Mining Leads"], tuition: "$2,500 / yr", website: "https://satbayev.university/en", image: "https://satbayev.university/file/2020/04/28/7be8fa/_793-446.jpg" }),
  ]},
  { id: 'uae', name: 'UAE', flag: '🇦🇪', difficultyLabel: 'Hard', description: 'Global campus branches and modern state-run labs.', universities: [
    createUni('ae_kha', 'Khalifa University', 'Abu Dhabi', 'UAE', 202, 'Hard', { gpa: "3.7", ielts: "6.5", test: "SAT Math 750", other: "Futuristic Vision", alumni: ["Sarah Al Amiri", "Scientists"], tuition: "$25,000 / yr", website: "https://www.ku.ac.ae/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnZOSWkkm_BOdlS7s-B5mTSJ6KD7d66c84GQ&s" }),
    createUni('ae_nyu', 'NYU Abu Dhabi', 'Abu Dhabi', 'UAE', 10, 'Hard', { gpa: "3.9", ielts: "7.5", test: "SAT 1550+", other: "Social Entrepreneurship", alumni: ["Policy Leaders", "Global Scholars"], tuition: "$30,000 / yr", website: "https://nyuad.nyu.edu/en/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXTtIj_P6q7gU5oStupH4BpWYUnKHzCuP5Yg&s" }),
    createUni('ae_aus', 'American Uni of Sharjah', 'Sharjah', 'UAE', 350, 'Medium', { gpa: "3.5", ielts: "6.5", test: "SAT 1350+", other: "Islamic Architecture", alumni: ["CEOs", "Architects"], tuition: "$22,000 / yr", website: "https://www.aus.edu/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTU66wU0vAttEXAeiaRaLMzlaOhdTl4UsFTqg&s" }),
    createUni('ae_zay', 'Zayed University', 'Dubai', 'UAE', 701, 'Medium', { gpa: "3.2", ielts: "6.0", test: "EmSAT 1250+", other: "Organic Design", alumni: ["Sheikha Latifa", "Directors"], tuition: "$18,000 / yr", website: "https://www.zu.ac.ae/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSl4Grrfu2cNhcEwsWLuiwVFEt5M9lAyeCBtA&s" }),
    createUni('ae_uae', 'UAE University', 'Al Ain', 'UAE', 300, 'Medium', { gpa: "3.4", ielts: "6.0", test: "EmSAT 1100+", other: "Medical Leadership", alumni: ["Noura Al Kaabi", "Ministers"], tuition: "$15,000 / yr", website: "https://www.uaeu.ac.ae/en/", image: "https://dgjonesworld.com/uploads/UAE-University.jpeg" }),
  ]},
  { id: 'malaysia', name: 'Malaysia', flag: '🇲🇾', difficultyLabel: 'Moderate', description: 'Affordable quality with international branches.', universities: [
    createUni('my_uma', 'University of Malaya', 'Kuala Lumpur', 'Malaysia', 65, 'Hard', { gpa: "3.5", ielts: "6.0", test: "A-Levels AAA", other: "Historic Leadership", alumni: ["Mahathir Mohamad", "Anwar Ibrahim"], tuition: "$4,000 / yr", website: "https://www.um.edu.my/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPtse1ivUcj8-9HBDLdEkdldvcjfUmgCHHcg&s" }),
    createUni('my_tay', 'Taylor’s University', 'Subang Jaya', 'Malaysia', 284, 'Medium', { gpa: "3.0", ielts: "5.5", test: "Portfolio", other: "Modern Strategy", alumni: ["Designers", "Leaders"], tuition: "$9,000 / yr", website: "https://university.taylors.edu.my/en.html", image: "https://studyfans.com/_next/image?url=https%3A%2F%2Fbackend.studyfans.com%2Fstorage%2Fmedia%2FUniversities%2Fmain_image%2F2780%2F4ffv8kDWKWqr39Uxfw4A3RSUBlRB2FwN9fFABUs8.webp&w=1080&q=100" }),
    createUni('my_mon', 'Monash Malaysia', 'Sunway', 'Malaysia', 42, 'Hard', { gpa: "3.4", ielts: "6.5", test: "SAT 1200+", other: "Medical Research", alumni: ["Researchers", "CEOs"], tuition: "$14,000 / yr", website: "https://www.monash.edu.my/", image: "https://www.usnews.com/object/image/00000153-ec2c-d802-ab7f-feacb9230000/160406-monashu-submitted.jpg?update-time=1459956316556&size=responsiveFlow970" }),
    createUni('my_apu', 'APU', 'Kuala Lumpur', 'Malaysia', 600, 'Easy', { gpa: "3.0", ielts: "5.0", test: "Tech Aptitude", other: "Digital Innovation", alumni: ["Cybersecurity Experts", "Game Devs"], tuition: "$6,500 / yr", website: "https://www.apu.edu.my/", image: "https://globusedu.kz/wp-content/uploads/2018/05/apu-2.jpg" }),
    createUni('my_sun', 'Sunway University', 'Subang Jaya', 'Malaysia', 500, 'Medium', { gpa: "3.2", ielts: "6.0", test: "Diploma", other: "Social Vision", alumni: ["Jeffrey Cheah", "Corporate Leads"], tuition: "$8,500 / yr", website: "https://sunwayuniversity.edu.my/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYbAD_6w7c6IXTu2UxN88EvGx_TB4_0eFHUg&s" }),
  ]},
  { id: 'thailand', name: 'Thailand', flag: '🇹🇭', difficultyLabel: 'Moderate', description: 'Vibrant academic tradition in the heart of SE Asia.', universities: [
    createUni('th_chu', 'Chulalongkorn University', 'Bangkok', 'Thailand', 211, 'Hard', { gpa: "3.5", ielts: "6.5", test: "SAT 1350+", other: "Heritage Impact", alumni: ["Princess Sirindhorn", "Magnates"], tuition: "$5,000 / yr", website: "https://www.chula.ac.th/en/", image: "https://smapse.ru/storage/2018/09/converted/825_585_chulalongkorn-university-cu-5.jpg" }),
    createUni('th_mah', 'Mahidol University', 'Bangkok', 'Thailand', 382, 'Hard', { gpa: "3.5", ielts: "6.5", test: "SAT 1300+", other: "Public Health", alumni: ["Dr. Prasert", "Health Leads"], tuition: "$6,000 / yr", website: "https://mahidol.ac.th/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNV23WL7S7IVWp5WS_ubsj0RTUkIgGm2oRrA&s" }),
    createUni('th_tha', 'Thammasat University', 'Bangkok', 'Thailand', 500, 'Medium', { gpa: "3.3", ielts: "6.0", test: "GSAT 1100+", other: "Political Insight", alumni: ["Pridi Banomyong", "PMs"], tuition: "$4,500 / yr", website: "https://tu.ac.th/en", image: "https://schoolingvisa.com/wp-content/uploads/2025/06/Thammasat-University.jpg" }),
    createUni('th_cmu', 'Chiang Mai University', 'Chiang Mai', 'Thailand', 600, 'Medium', { gpa: "3.0", ielts: "5.5", test: "Records", other: "Artistry", alumni: ["Yingluck Shinawatra", "Artists"], tuition: "$3,500 / yr", website: "https://www.cmu.ac.th/en", image: "https://smapse.ru/storage/2018/10/converted/660_464_dai-hoc-chiang-mai-cmu-202220.jpg" }),
    createUni('th_kas', 'Kasetsart University', 'Bangkok', 'Thailand', 700, 'Easy', { gpa: "3.0", ielts: "5.5", test: "Portfolio", other: "Agriculture", alumni: ["Pioneers", "Engineers"], tuition: "$3,200 / yr", website: "https://www.ku.ac.th/en", image: "https://smapse.ru/storage/2018/10/converted/660_464_ku-library.jpg" }),
  ]},
  { id: 'vietnam', name: 'Vietnam', flag: '🇻🇳', difficultyLabel: 'Moderate', description: 'Rapidly advancing education sector in SE Asia.', universities: [
    createUni('vn_duy', 'Duy Tan University', 'Da Nang', 'Vietnam', 400, 'Easy', { gpa: "3.2", ielts: "5.5", test: "GCE A-Levels", other: "Regional Tech", alumni: ["Managers", "Founders"], tuition: "$2,500 / yr", website: "https://duytan.edu.vn/en", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ82rUFFqJterfArn4lf207-kei-pEi54ZOlg&s" }),
    createUni('vn_tdt', 'Ton Duc Thang', 'Ho Chi Minh', 'Vietnam', 600, 'Medium', { gpa: "3.3", ielts: "5.5", test: "State Exam", other: "Athletic Resilience", alumni: ["Civic Leaders", "Researchers"], tuition: "$2,800 / yr", website: "https://www.tdtu.edu.vn/en", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEK-oIXoweAqQv-tKNpE4T2xnOorECPSRUWw&s" }),
    createUni('vn_vnu', 'VNU Hanoi', 'Hanoi', 'Vietnam', 801, 'Hard', { gpa: "3.4", ielts: "6.0", test: "Aptitude", other: "Academic Ethics", alumni: ["Ngo Bao Chau", "V.D. Dam"], tuition: "$3,000 / yr", website: "https://vnu.edu.vn/eng/", image: "https://image.free-apply.com/gallery/l/uni/gallery/lg/1070400073/a423d23437f373cfe7f0f6fe14b428dce19d0765.jpg?s=640" }),
    createUni('vn_hus', 'HUST', 'Hanoi', 'Vietnam', 1000, 'Hard', { gpa: "3.5", ielts: "6.0", test: "Math Entrance", other: "Engineering Prowess", alumni: ["Entrepreneurs", "Engineers"], tuition: "$3,500 / yr", website: "https://en.hust.edu.vn/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRChUllVxlJ1IXRYz62EQ7ot6xuxSVkhNWfqg&s" }),
    createUni('vn_rmi', 'RMIT Vietnam', 'Ho Chi Minh', 'Vietnam', 150, 'Hard', { gpa: "3.2", ielts: "6.5", test: "RMIT English", other: "Global Creativity", alumni: ["Managers", "Artists"], tuition: "$14,000 / yr", lang: "English", website: "https://www.rmit.edu.vn/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHTc7_n95XM2X0q54C_tVmYXYX6hp_xyQ0Xw&s" }),
  ]},
  { id: 'philippines', name: 'Philippines', flag: '🇵🇭', difficultyLabel: 'Moderate', description: 'Strong healthcare and English-medium tradition.', universities: [
    createUni('ph_upd', 'UP Diliman', 'Manila', 'Philippines', 402, 'Hard', { gpa: "3.5", ielts: "6.0", test: "UPCAT", other: "Social Awareness", alumni: ["Maria Ressa", "F. Marcos"], tuition: "$2,000 / yr", website: "https://upd.edu.ph/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMz5zdkBBACm0Xm1eFXdJbhxPBg0DJ3oMDOA&s" }),
    createUni('ph_adu', 'Ateneo de Manila', 'Manila', 'Philippines', 563, 'Hard', { gpa: "3.6", ielts: "6.5", test: "ACET", other: "Jesuit Values", alumni: ["Jose Rizal", "B. Aquino III"], tuition: "$5,000 / yr", website: "https://www.ateneo.edu/", image: "https://image.free-apply.com/gallery/l/uni/gallery/lg/1060800002/0e86924796dd528d41bd5f5644e7bc0c2febe4bd.jpg?s=640" }),
    createUni('ph_dls', 'De La Salle University', 'Manila', 'Philippines', 681, 'Medium', { gpa: "3.4", ielts: "6.0", test: "DCAT", other: "Business Ethics", alumni: ["Jesse Robredo", "G. Valenciano"], tuition: "$4,800 / yr", website: "https://www.dlsu.edu.ph/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSodsjUXSnvv8ngYfA_sRXspRjeLpIhtw_T3A&s" }),
    createUni('ph_ust', 'Uni of Santo Tomas', 'Manila', 'Philippines', 801, 'Medium', { gpa: "3.3", ielts: "6.0", test: "USTET", other: "Historic Tradition", alumni: ["M. Quezon", "Figures"], tuition: "$3,500 / yr", website: "https://www.ust.edu.ph/", image: "https://www.rappler.com/tachyon/r3-assets/612F469A6EA84F6BAE882D2B94A4B421/img/F00BE1B08EDF40CAAEB9CF788ACC8FA1/ust_F00BE1B08EDF40CAAEB9CF788ACC8FA1.jpg" }),
    createUni('ph_map', 'Mapúa University', 'Manila', 'Philippines', 1200, 'Medium', { gpa: "3.0", ielts: "5.5", test: "MSCAT", other: "Technical Grit", alumni: ["Engineers", "Architects"], tuition: "$3,800 / yr", website: "https://www.mapua.edu.ph/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzuNqSrtZoChW8hnpP1Btvx32hvqO7r4W_rw&s" }),
  ]},
  { id: 'indonesia', name: 'Indonesia', flag: '🇮🇩', difficultyLabel: 'Moderate', description: 'Vast variety of research and specialized schools.', universities: [
    createUni('id_uii', 'University of Indonesia', 'Depok', 'Indonesia', 237, 'Hard', { gpa: "3.5", ielts: "6.0", test: "SAT 1300+", other: "Cultural Leadership", alumni: ["Sri Mulyani", "Habibie"], tuition: "$3,500 / yr", website: "https://www.ui.ac.id/en/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1R0UWQ6oEdHvjfFMQFwpsjIgqOg1z0-QauA&s" }),
    createUni('id_ugm', 'Gadjah Mada', 'Yogyakarta', 'Indonesia', 263, 'Hard', { gpa: "3.5", ielts: "6.0", test: "SAT 1250+", other: "National Unity", alumni: ["Joko Widodo", "A. Baswedan"], tuition: "$3,200 / yr", website: "https://ugm.ac.id/en", image: "https://techportal.in/wp-content/uploads/2023/12/gedung-pusat.jpg" }),
    createUni('id_itb', 'ITB Bandung', 'Bandung', 'Indonesia', 281, 'Hard', { gpa: "3.6", ielts: "6.0", test: "SAT Math 720", other: "Science Vision", alumni: ["Sukarno", "Habibie"], tuition: "$4,000 / yr", website: "https://www.itb.ac.id/en", image: "https://paristech.fr/sites/default/files/styles/bandeau_haut/public/2023-10/adobestock_609569289_itb_bandung_sony_herdiana.jpeg?itok=zlrHTGTI" }),
    createUni('id_ipb', 'IPB Bogor', 'Bogor', 'Indonesia', 449, 'Medium', { gpa: "3.3", ielts: "5.5", test: "GPA", other: "Biological Agility", alumni: ["SBY", "Scientists"], tuition: "$3,000 / yr", website: "https://ipb.ac.id/en", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRp6pM4ibPLAuxYUQWe-cXFPEscD8v3rV4sbA&s" }),
    createUni('id_bin', 'Binus University', 'Jakarta', 'Indonesia', 951, 'Easy', { gpa: "3.0", ielts: "5.5", test: "TPKS", other: "Digital Strategy", alumni: ["W. Tanuwijaya", "CEOs"], tuition: "$6,000 / yr", website: "https://binus.ac.id/en", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8xJR0RV_lNjD10vuZX70HfJDOWOlCU3NSkw&s" }),
  ]},
  { id: 'india', name: 'India', flag: '🇮🇳', difficultyLabel: 'Very Hard (Heavy)', description: 'Engineering and research giant with intense entry exams.', universities: [
    createUni('in_iitd', 'IIT Delhi', 'Delhi', 'India', 150, 'Hard', { gpa: "3.8", ielts: "6.5", test: "JEE 1000 Rank", other: "Analytical Grit", alumni: ["D. Goyal", "B. Bansal"], tuition: "$3,000 / yr", website: "https://home.iitd.ac.in/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkmCM-2o14EpsjmZBRUAa37Ua3Rt7GjpI7eg&s" }),
    createUni('in_iitb', 'IIT Bombay', 'Mumbai', 'India', 149, 'Hard', { gpa: "3.9", ielts: "6.5", test: "JEE 500 Rank", other: "Innovation Power", alumni: ["N. Nilekani", "B. Aggarwal"], tuition: "$3,000 / yr", website: "https://www.iitb.ac.in/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTCe3FTMpAKUfKR0qHa8-motIkYzIsTK_DMlw&s" }),
    createUni('in_iitm', 'IIT Madras', 'Chennai', 'India', 227, 'Hard', { gpa: "3.8", ielts: "6.5", test: "JEE 1500 Rank", other: "Deep Tech", alumni: ["K. Gopalakrishnan", "Quantum Labs"], tuition: "$3,000 / yr", website: "https://www.iitm.ac.in/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_IXXx3LchcNL_vrSVdFoi8wVOBb5jzbbKOA&s" }),
    createUni('in_iisc', 'IISc Bangalore', 'Bangalore', 'India', 211, 'Hard', { gpa: "4.0", ielts: "7.0", test: "SAT 1580+", other: "Scientific Inquiry", alumni: ["C.N.R. Rao", "V.K. Saraswat"], tuition: "$1,500 / yr", website: "https://iisc.ac.in/", image: "https://www.orchidfoundation.info/sites/default/files/2021-03/International%20Institute%20of%20Information%20Technology%20banglore.jpg" }),
    createUni('in_dli', 'University of Delhi', 'Delhi', 'India', 407, 'Medium', { gpa: "3.7", ielts: "6.0", test: "CUET 99%", other: "Narrative Excellence", alumni: ["Shah Rukh Khan", "Aung San Suu Kyi"], tuition: "$500 / yr", website: "https://www.du.ac.in/", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8EO0oDW2vqDnIg9iT7x_FX19CICQXcrFMhQ&s" }),
  ]}
];

// Helper to set dates relative to now so the timer is always active for demo purposes
const now = new Date();
const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);
const twoMonths = new Date(now.getFullYear(), now.getMonth() + 2, 20);
const threeMonths = new Date(now.getFullYear(), now.getMonth() + 3, 5);

export const UPCOMING_DEADLINES: Deadline[] = [
  { id: '1', universityName: 'Seoul National University', countryFlag: '🇰🇷', date: nextMonth.toISOString(), label: 'Spring Intake 2026', website: 'https://en.snu.ac.kr/' },
  { id: '2', universityName: 'National University of Singapore', countryFlag: '🇸🇬', date: twoMonths.toISOString(), label: 'Regular Decision', website: 'https://www.nus.edu.sg/' },
  { id: '3', universityName: 'Tsinghua University', countryFlag: '🇨🇳', date: threeMonths.toISOString(), label: 'Global Admissions', website: 'https://www.tsinghua.edu.cn/en/' },
  { id: '4', universityName: 'Nazarbayev University', countryFlag: '🇰🇿', date: new Date(now.getFullYear() + 1, 3, 1).toISOString(), label: 'Early Admission', website: 'https://nu.edu.kz/' },
  { id: '5', universityName: 'University of Tokyo', countryFlag: '🇯🇵', date: new Date(now.getFullYear(), 11, 1).toISOString(), label: 'Winter Intake', website: 'https://www.u-tokyo.ac.jp/en/' },
  { id: '6', universityName: 'NYU Abu Dhabi', countryFlag: '🇦🇪', date: new Date(now.getFullYear(), 10, 15).toISOString(), label: 'Early Decision I', website: 'https://nyuad.nyu.edu/en/' }
];