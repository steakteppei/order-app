// ST-Order shared data & helpers — single source of truth (一元化マスタ)
// このファイル1つを直せば index.html / send.html 両方に反映される。
// 業者(V)・メール宛先(EC)・祝日(HI_NAMES)・繁忙/閑散・共通関数をここに集約。
// 注意: ここは純粋なデータ＆計算のみ。document/window 参照は入れないこと
//       （sw.js が importScripts で読み込むため）。

var APP_VERSION='5.23'; // ★ バージョンはここ1か所だけ更新する（version.json も同じ番号に）

var HI_NAMES={
  '2026-01-01':"New Year's Day",
  '2026-01-19':'MLK Day',
  '2026-02-16':"Presidents Day",
  '2026-03-26':'Prince Kuhio Day',
  '2026-04-03':'Good Friday',
  '2026-05-25':'Memorial Day',
  '2026-06-11':'King Kamehameha Day',
  '2026-07-03':'Independence Day (observed)',
  '2026-08-21':'Statehood Day',
  '2026-09-07':'Labor Day',
  '2026-11-03':'General Election Day',
  '2026-11-11':'Veterans Day',
  '2026-11-26':'Thanksgiving',
  '2026-12-25':'Christmas',
  '2027-01-01':"New Year's Day",
  '2027-01-18':'MLK Day',
  '2027-02-15':"Presidents Day",
  '2027-03-26':'Prince Kuhio Day / Good Friday',
  '2027-05-31':'Memorial Day',
  '2027-06-11':'King Kamehameha Day',
  '2027-07-05':'Independence Day (observed)',
  '2027-08-20':'Statehood Day',
  '2027-09-06':'Labor Day',
  '2027-11-11':'Veterans Day',
  '2027-11-25':'Thanksgiving',
  '2027-12-27':'Christmas (observed)'
};
var HI=Object.keys(HI_NAMES);

// Hawaii DOE School Break periods (HIDOE official calendar)
// Source: hawaiipublicschools.org
var SCHOOL_BREAKS=[
  // 2025-2026
  {name:'Spring Break',start:'2026-03-23',end:'2026-03-27'},
  {name:'Summer Break',start:'2026-05-29',end:'2026-08-02'},
  // 2026-2027
  {name:'Fall Break',  start:'2026-10-05',end:'2026-10-09'},
  {name:'Winter Break',start:'2026-12-21',end:'2027-01-01'},
  {name:'Spring Break',start:'2027-03-15',end:'2027-03-19'},
  {name:'Summer Break',start:'2027-05-28',end:'2027-08-01'}
];
// ── Japan holidays (tourist influx to Hawaii) ──
var JP_BUSY=[
  // 年末年始
  {name:'Japan New Year Holiday',start:'2025-12-26',end:'2026-01-04'},
  // GW
  {name:'Japan Golden Week',     start:'2026-04-29',end:'2026-05-06'},
  // お盆
  {name:'Japan Obon',            start:'2026-08-10',end:'2026-08-17'},
  // シルバーウィーク 2026のみ5連休（2024・2025は3連休のみ）
  {name:'Japan Silver Week',     start:'2026-09-19',end:'2026-09-23'},
  // 年末年始
  {name:'Japan New Year Holiday',start:'2026-12-26',end:'2027-01-03'},
  // GW
  {name:'Japan Golden Week',     start:'2027-04-29',end:'2027-05-05'},
  // お盆
  {name:'Japan Obon',            start:'2027-08-10',end:'2027-08-17'}
];

// ── US & Japan tourist busy periods ──
var EVENTS=[
  // ── Winter Peak Season（12月中旬〜3月末：ハワイ最繁忙期）──
  {name:'Winter Peak Season',           start:'2025-12-15',end:'2026-01-04'},
  {name:'Canada Snowbird Season',        start:'2026-01-05',end:'2026-03-31'},
  {name:'Valentine\'s & Presidents Day', start:'2026-02-12',end:'2026-02-16'},
  {name:'US Spring Break',              start:'2026-03-14',end:'2026-04-12'},
  {name:'Japan Spring Break',           start:'2026-03-20',end:'2026-04-05'},

  // ── Summer Season（6〜8月：年間最多訪問者）──
  {name:'US Summer Break',              start:'2026-06-06',end:'2026-08-20'},
  {name:'Japan Summer Break',           start:'2026-07-18',end:'2026-08-31'},

  // ── Fall / Holiday Season ──
  {name:'Labor Day Weekend',            start:'2026-09-05',end:'2026-09-07'},
  {name:'September Holidays',           start:'2026-09-13',end:'2026-09-23'},
  {name:'Thanksgiving Week',            start:'2026-11-25',end:'2026-11-29'},
  {name:'Honolulu Marathon 🏃',         start:'2026-12-11',end:'2026-12-13'},
  {name:'Christmas Week',               start:'2026-12-22',end:'2026-12-26'},

  // ── Memorial Day ──
  {name:'Memorial Day Weekend',         start:'2026-05-23',end:'2026-05-25'},
  // ── Independence Day ──
  {name:'Independence Day',             start:'2026-07-03',end:'2026-07-06'},

  // ── 2027 ──
  {name:'Winter Peak Season',           start:'2026-12-15',end:'2027-01-03'},
  {name:'Canada Snowbird Season',        start:'2027-01-04',end:'2027-03-31'},
  {name:'Valentine\'s & Presidents Day', start:'2027-02-11',end:'2027-02-15'},
  {name:'US Spring Break',              start:'2027-03-13',end:'2027-04-11'},
  {name:'Japan Spring Break',           start:'2027-03-20',end:'2027-04-05'},
  {name:'Memorial Day Weekend',         start:'2027-05-29',end:'2027-05-31'},
  {name:'US Summer Break',              start:'2027-06-05',end:'2027-08-20'},
  {name:'Japan Summer Break',           start:'2027-07-18',end:'2027-08-31'},
  {name:'Independence Day',             start:'2027-07-04',end:'2027-07-06'},
  {name:'Labor Day Weekend',            start:'2027-09-04',end:'2027-09-06'},
  {name:'September Holidays',           start:'2027-09-13',end:'2027-09-23'},
  {name:'Thanksgiving Week',            start:'2027-11-24',end:'2027-11-28'},
  {name:'Honolulu Marathon 🏃',         start:'2027-12-11',end:'2027-12-13'},
  {name:'Christmas Week',               start:'2027-12-22',end:'2027-12-27'}
];

// ── Slow seasons（閑散期：発注を控えめに）──
var SLOW_SEASONS=[
  // Spring lull: スプリングブレーク後〜GW前（GW期間4/29-5/6は除外）
  {name:'Slow Season',start:'2026-04-15',end:'2026-04-28'},
  // GW後〜Memorial Day前（5/7〜5/22）
  {name:'Slow Season',start:'2026-05-07',end:'2026-05-22'},
  // Sep: Labor Day直後〜September Holidays前（9/8〜9/12）
  {name:'Slow Season',start:'2026-09-08',end:'2026-09-12'},
  {name:'Slow Season',start:'2026-10-08',end:'2026-11-19'},
  // 2027
  {name:'Slow Season',start:'2027-04-15',end:'2027-04-28'},
  {name:'Slow Season',start:'2027-05-07',end:'2027-05-22'},
  {name:'Slow Season',start:'2027-09-07',end:'2027-09-12'},
  {name:'Slow Season',start:'2027-10-07',end:'2027-11-18'}
];
// ── Honolulu Marathon dates（強調表示用）──
var MARATHON_DATES=[
  {start:'2026-12-04',end:'2026-12-13'},
  {start:'2027-12-03',end:'2027-12-13'}
];
function getSlowSeason(dateStr){
  for(var i=0;i<SLOW_SEASONS.length;i++){
    var b=SLOW_SEASONS[i];if(dateStr>=b.start&&dateStr<=b.end)return b.name;
  }return null;
}
function getMarathon(dateStr){
  for(var i=0;i<MARATHON_DATES.length;i++){
    var b=MARATHON_DATES[i];if(dateStr>=b.start&&dateStr<=b.end)return true;
  }return false;
}
function getEvent(dateStr){
  for(var i=0;i<EVENTS.length;i++){
    var b=EVENTS[i];
    if(dateStr>=b.start&&dateStr<=b.end)return b.name;
  }
  return null;
}

function getJpBusy(dateStr){
  for(var i=0;i<JP_BUSY.length;i++){
    var b=JP_BUSY[i];
    if(dateStr>=b.start&&dateStr<=b.end)return b.name;
  }
  return null;
}

function getSchoolBreak(dateStr){
  for(var i=0;i<SCHOOL_BREAKS.length;i++){
    var b=SCHOOL_BREAKS[i];
    if(dateStr>=b.start&&dateStr<=b.end)return b.name;
  }
  return null;
}
function isHoliday(dt){var s=dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate());return HI.indexOf(s)>=0;}
function pad(n){return n<10?'0'+n:String(n);}
function dow(dt){return dt.getDay();}
function prevBusinessDay(dt){var p=new Date(dt);p.setDate(p.getDate()-1);while(dow(p)===0||dow(p)===6||isHoliday(p))p.setDate(p.getDate()-1);return p;}
// ── 送信者（発注担当者）──
// send.html の「Sent by」ボタン・本文の署名・CC の自動除外に使う。
// email は EC の cc に載っているアドレスと完全一致させること
//（getCC() が送信者本人のアドレスを CC から外すため）。
// 注意: Nao と Harold は共有アドレス admin@teppei-usa.com を使う。
//       同じアドレスの送信者が複数いても、CC には admin@ を1回だけ載せる。
var SENDERS=[
  {key:'aki',   label:'Aki',    email:'aki@teppei-usa.com'},
  {key:'kacee', label:'Kacee',  email:'kacee@teppei-usa.com'},
  {key:'shaine',label:'Shaine', email:'shaine@teppei-usa.com'},
  {key:'nao',   label:'Nao',    email:'admin@teppei-usa.com'},
  {key:'harold',label:'Harold', email:'admin@teppei-usa.com'}
];

// EC に業者が無い場合のフォールバック CC（社内全員）
var DEFAULT_CC='aki@teppei-usa.com,kacee@teppei-usa.com,shaine@teppei-usa.com,admin@teppei-usa.com';

var EC={
  eskimo:{to:'oahuorders@eskimocandy.com',cc:'aki@teppei-usa.com,kacee@teppei-usa.com,shaine@teppei-usa.com,admin@teppei-usa.com'},
  alamoana:{to:'order@alamoanaproduce.com',cc:'todd@alamoanaproduce.com,aki@teppei-usa.com,kacee@teppei-usa.com,shaine@teppei-usa.com,admin@teppei-usa.com'},
  costco:{to:'w687mbd9@costco.com',cc:'aki@teppei-usa.com,kacee@teppei-usa.com,shaine@teppei-usa.com,admin@teppei-usa.com'},
  fukuoka:{to:'hi-sales@fukupa.com',cc:'aki@teppei-usa.com,kacee@teppei-usa.com,shaine@teppei-usa.com,admin@teppei-usa.com'}
};
var V=[
  {id:'alamoana',name:'Ala Moana Produce',short:'Ala Moana Produce',method:'email',
   di:'Delivery: Mon, Wed & Fri only | Order deadline: Same day by 6:00 AM | Min. order: $100',tbd:false,minOrder:100,
   ok:function(dt){return dow(dt)===1||dow(dt)===3||dow(dt)===5;},
   dl:function(dt){return 'Order by: '+dt.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+' by 6:00 AM';},
   items:[{n:'Lemon 140s Choice',u:'CS',p:61.97},{n:'Onion Jumbo 50# Sack',u:'SK',p:39.44},{n:'Spring Mix 3#',u:'CS',p:23.66}]},
  {id:'atm',name:'ATM International USA, Inc.',short:'ATM International',method:'line',
   di:'Delivery: Mon-Fri (no holidays) | Order deadline: Same day by 7:00 AM',tbd:false,
   ok:function(dt){return dow(dt)>=1&&dow(dt)<=5&&!isHoliday(dt);},
   dl:function(dt){return 'Order by: '+dt.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+' by 7:00 AM';},
   items:[{n:'Wagyu Ribeye Lipon 30LB',u:'CS'}]},
  {id:'apax',name:'Apax Hawaii (CPH Holdings)',short:'Apax Hawaii',method:'line',
   di:'Delivery: Mon & Thu only | Order deadline: Previous day by 12:00 PM',tbd:false,
   ok:function(dt){return dow(dt)===1||dow(dt)===4;},
   dl:function(dt){var p=prevBusinessDay(dt);return 'Order by: '+p.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+' by 12:00 PM';},
   items:[{n:'1 oz Cup (P100N)',u:'CS'},{n:'1 oz Lid (PL100N)',u:'CS'},{n:'2 oz Cup (P200N)',u:'CS'},{n:'2 oz Lid (PL200N)',u:'CS'},{n:'8in 3-Comp (ML-83 Black)',u:'CS'},{n:'12 oz Paper Container',u:'CS'},{n:'12 oz Lid YS-390',u:'CS'},{n:'16 oz PP Round (848)',u:'CS'},{n:'32 oz PP Bento Rectangle (828)',u:'CS'},{n:'Chopstick Wooden',u:'CS'},{n:'Dinner Napkin 2PLY',u:'CS'},{n:'Fork Compostable 6in CPLA',u:'CS'},{n:'Multifold Towel Trifold',u:'CS'},{n:'Spoon Compostable 6in CPLA',u:'CS'},{n:'Tbag Lrg (Produce Roll)',u:'CS'}]},
  {id:'cocacola',name:'Coca-Cola Bottling Co. of Hawaii',short:'Coca-Cola Hawaii',method:'sms',
   di:'Delivery: Tuesday only | Order deadline: Previous Friday by 2:00 PM',tbd:false,
   ok:function(dt){return dow(dt)===2;},phone:'Coca Cola - Steak Teppei',
   dl:function(dt){var f=new Date(dt);f.setDate(f.getDate()-4);return 'Order by: '+f.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+' by 2:00 PM';},
   items:[{n:'Coca-Cola Original 20 fl oz',u:'CS'},{n:'Coca-Cola Zero 20 fl oz',u:'CS'},{n:'Dasani 16.9 fl oz',u:'CS'},{n:'Sprite 20 fl oz',u:'CS'}]},
  {id:'costco',name:'Costco Wholesale',short:'Costco',method:'email',
   di:'Delivery: Mon & Thu only | Mon: Prev Fri by 12pm | Thu: Prev Wed by 12pm',tbd:false,
   ok:function(dt){return dow(dt)===1||dow(dt)===4;},
   dl:function(dt){var d=dow(dt)===1?-3:-1;var f=new Date(dt);f.setDate(f.getDate()+d);return 'Order by: '+f.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+' by 12:00 PM';},
   minOrder:1000,items:[{n:'Cage Free Large Eggs 5 Dozen #1025795',u:'CS',p:16.49},{n:'Christopher Ranch Peeled Garlic 3 lb #5855',u:'BAG',p:14.49},{n:'Horizon Heavy Whipping Cream 64 oz #506970',u:'CRTN',p:18.19},{n:'Kirkland Drinking Water 40pk 16.9 oz #782796',u:'CS',p:13.79},{n:'Kirkland Signature Stretch-Tite Plastic Food Wrap 12in x 3000ft #208733',u:'BOX',p:19.99},{n:'Kirkland Soybean Salad Oil 35 lb #71011',u:'CTN',p:39.59},{n:'Kirkland Unsalted Butter 4/1 lb #44110',u:'BOX',p:13.72}]},
  {id:'eskimo',name:'Eskimo Candy Oahu Inc.',short:'Eskimo Candy',method:'email',
   di:'Delivery: Mon-Fri (no holidays) | Order deadline: Previous day by 3:00 PM',tbd:false,
   ok:function(dt){return dow(dt)>=1&&dow(dt)<=5&&!isHoliday(dt);},
   dl:function(dt){var p=prevBusinessDay(dt);return 'Order by: '+p.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+' by 3:00 PM';},
   items:[{n:'Shrimp 21-25 White P&D T-On',u:'CS'}]},
  {id:'fukuoka',name:'Fukuoka Package USA, Inc.',short:'Fukuoka Package',method:'email',
   di:'Delivery: Mon, Wed & Fri only | Order deadline: Previous day by 12:00 PM',tbd:false,
   ok:function(dt){return dow(dt)===1||dow(dt)===3||dow(dt)===5;},
   dl:function(dt){var p=prevBusinessDay(dt);return 'Order by: '+p.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+' by 12:00 PM';},
   items:[{n:'KM-57-T 8X8 3-COMP',u:'CS'}]},
  {id:'freshisland',name:'Fresh Island Fish Co., Inc.',short:'Fresh Island Fish',method:'sms',
   di:'Delivery: Mon-Sat (no holidays) | Order deadline: Same day by 7:00 AM',tbd:false,
   ok:function(dt){return dow(dt)!==0&&!isHoliday(dt);},phone:'BPO not included Fresh Island Fish - Steak Teppei',
   dl:function(dt){return 'Order by: '+dt.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+' by 7:00 AM';},
   items:[{n:'Beef Vein Steak Choice 20/8oz',u:'CS'},{n:'Shrimp 21/25 White P&D T-On',u:'CS'},{n:'Chicken Thighs Boneless Skinless',u:'CS'}]},
  {id:'wismettac',name:'Wismettac Asian Foods, Inc.',short:'Wismettac',method:'line',
   di:'Delivery: Friday only | Order deadline: Previous day by 12:00 PM',tbd:false,
   ok:function(dt){return dow(dt)===5;},
   dl:function(dt){var p=prevBusinessDay(dt);return 'Order by: '+p.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+' by 12:00 PM';},
   items:[{n:'Hondashi',u:'BOX'},{n:'Miso Dispenser',u:'BAG'},{n:'Mizkan Rice Vinegar',u:'BTL'},{n:'MSG Aji No Moto 1LB',u:'BAG'},{n:'Rice Sekka 40LB',u:'BAG'},{n:'Soy Sauce Yamasa 5GAL',u:'CTN'},{n:'Starch Potato Katakuriko 5LB',u:'CS'},{n:'Sukiyaki Sauce 5.4LB',u:'BOX'},{n:'Wakame Seaweed 0.8 sm bag',u:'BAG'},{n:'Wasabi Nama Fresh FRZ 800G',u:'BAG'}]},
  {id:'wongs',name:"Wong's Meat Market, Ltd.",short:"Wong's Meat Market",method:'sms',
   di:'Delivery: Mon-Fri (no holidays) | Order deadline: Previous day by 2:00 PM',tbd:false,
   ok:function(dt){return dow(dt)>=1&&dow(dt)<=5&&!isHoliday(dt);},phone:"Wong's - Steak Teppei",
   dl:function(dt){var p=prevBusinessDay(dt);return 'Order by: '+p.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+' by 2:00 PM';},
   items:[{n:'Beef Strip Steak 8oz',u:'CS'},{n:'Chicken Thighs Boneless Skinless 4x10LB',u:'CS'},{n:'Pork Back Fat Skinned 50LB',u:'CS'}]}
];
function gv(id){for(var i=0;i<V.length;i++)if(V[i].id===id)return V[i];return null;}

var ML={email:'Gmail',sms:'Text Message',line:'LINE'};
