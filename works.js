// Shayu: seven collections, 32 references. Danqingdu: two collections, four references.
window.LUO_PROJECT = {
 title:'沙谕 AIGC',year:'2026',video:'assets/shayu.mp4',poster:'assets/film-poster.webp',
 categories:[
  {id:'characters',title:'角色设计',en:'CHARACTER DESIGN',collections:['girl','guard','bishop','creature','scale']}
 ],
 collections:[
  {id:'environment',title:'环境设计',en:'ENVIRONMENT',images:[13,16,15,14,17,18,19,20,21]},
  {id:'girl',title:'少女',en:'CHARACTER / 01',images:[33,32,31,34,35]},
  {id:'bishop',title:'主教',en:'CHARACTER / 02',images:[22,23,24,25]},
  {id:'guard',title:'守卫长',en:'CHARACTER / 03',images:[29,26,28,27,30]},
  {id:'creature',title:'巨兽',en:'CREATURE DESIGN',images:[37,36,38,39]},
  {id:'props',title:'道具设计',en:'PROPS & MATERIALS',images:[42,43,44]},
  {id:'scale',title:'角色比例',en:'SCALE & RELATIONSHIPS',images:[40,41]}
 ]
};
window.LUO_REMIX = {
 title:'丹青渡二创鬼畜 · 终有得祀',
 poster:'assets/danqingdu/film-poster.webp',
 collections:[
  {id:'danqingdu-characters',title:'角色设定',en:'CHARACTER STUDIES',projectTitle:'丹青渡二创鬼畜',images:[
   'assets/danqingdu/character-four-view.webp',
   'assets/danqingdu/character-sheet.webp',
   'assets/danqingdu/style-study.webp'
  ]},
  {id:'danqingdu-props',title:'道具设计',en:'PROP DESIGN',projectTitle:'丹青渡二创鬼畜',images:['assets/danqingdu/red-crystal.webp']}
 ]
};
window.LUO_IMAGE = id => typeof id==='string' ? id : `assets/art-${String(id).padStart(2,'0')}.webp`;
