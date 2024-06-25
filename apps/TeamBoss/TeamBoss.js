import {plugin} from '../../api/api.js';
import fs from 'node:fs';
import data from '../../model/XiuxianData.js';
import config from '../../model/Config.js';
import {
  Add_najie_thing,
  existplayer,
  convert2integer,
  Add_灵石,
  Read_player,
  bigNumberTransform,
  zd_battle,
  Harm,
  Add_HP,Read_Boss_List, Write_Boss_List, getNumversFromString, GetPower,Go,channel
} from '../../model/xiuxian.js';
import Show from "../../model/show.js";
import puppeteer from "../../../../lib/puppeteer/puppeteer.js";
/**
 * 作者：湖中屋
 */
/**
 * 药园模块
 */
let WorldBOSSBattleCD = []; //CD
/*let WorldBOSSBattleLock = []; //BOSS战斗锁，防止打架频率过高造成奖励多发
let WorldBOSSBattleUnLockTimer = 0; //防止战斗锁因意外锁死*/

export class TeamBoss extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: 'Yunzai_Bot_Garden',
      /** 功能描述 */
      dsc: '药园模块',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 600, //小功能高一些
      rule: [
        // {
        //   reg: '^#拔苗助长.*$',
        //   fnc: 'Get_vegetable',
        // },
        // {
        //   reg: '^#偷菜*$',
        //   fnc: 'Get_morevegetable',
        // },
        // {
        //   reg: '^#药园*$',
        //   fnc: 'Vegetable',
        // },
        // {
        //   reg: '^(禁言术|残云封天剑).*$',
        //   fnc: 'Silencing',
        // },
        // {
        //   reg: '^(除你禁言|废除).*$',
        //   fnc: 'Banislifted',
        // },
        // {
        //   reg: '^#建木((.*)|(.*)*(.*))$',
        //   fnc: 'Jianmu',
        // },
        {
          reg: '^#若陀龙王状态$',
          fnc: 'LookUpGroupBossStatus',
        },
        {
          reg: '^#龙王榜$',
          fnc: 'ShowGroupDamageList',
        },
        {
          reg: '^#讨伐若陀龙王$',
          fnc: 'GroupBossBattle',
        },
        {
          reg: '^#加入讨伐若陀龙王.*$',
          fnc: 'IntoGroupBoss',
        },
        {
          reg: '^#若陀龙王奖励$',
          fnc: 'SeeGroupBoss',
        },
        {
          reg: '^#若陀龙王出价.*$',
          fnc: 'offerGroupBoss',
        },
        {
          reg: '^#若陀龙王分配.*$',
          fnc: 'choiceGroupBoss',
        },
        {
          reg: '^#若陀龙王团本$',
          fnc: 'GroupBoss',
        },
        {
          reg: '^#退出若陀龙王团本$',
          fnc: 'OutGroupBoss',
        },
        {
          reg: '^#开启若陀龙王$',
          fnc: 'CreateWorldBoss',
        },
        {
          reg: '^#关闭若陀龙王$',
          fnc: 'DeleteWorldBoss',
        },
      ],
    });
    this.xiuxianConfigData = config.getConfig('xiuxian', 'xiuxian');
  }

  //若陀龙王开启指令
  async CreateWorldBoss(e) {
    if (e.isMaster) {
      let usr_qq = e.user_id.toString().replace('qg_','');
      usr_qq = await channel(usr_qq);
      await InitWorldBoss(usr_qq);
      e.reply(`哎呀呀，懒狗DD不在借用了BUG的力量。团本Boss若陀【若陀龙王】苏醒过来`);
      return false;
    }
  }
  //若陀龙王结束指令
  async DeleteWorldBoss(e) {
    if (e.isMaster) {
      let Boss_List = await Read_Boss_List();

      for (let i = 0; i < Boss_List.length; i++) {
        let boss = Boss_List[i];
        for (const item of boss.Boss_item) {
          await redis.del('Xiuxian:GardenBossPlayer'+ item);
        }
        await redis.del('Xiuxian:GardenBossStatus'+boss.Boss_id);
        await redis.del('Xiuxian:GardenRecord'+boss.Boss_id);

        e.reply('若陀龙王挑战'+boss.Boss_id+'号关闭！');
      }
      Boss_List=[]
      await Write_Boss_List(Boss_List)
      e.reply('关闭完成')
    } else return false;
  }

  async SeeGroupBoss(e) {
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    //检查存档
    let usr_qq = e.user_id.toString().replace('qg_','');
    usr_qq = await channel(usr_qq);
    let ifexistplay = await existplayer(usr_qq);
    if (!ifexistplay) {
      return;
    }
    //判断玩家是否参与击杀若陀龙王
    if(!(await redis.get('Xiuxian:GardenBossPlayer'+ usr_qq))){
      e.reply("你并未参与若陀龙王本");
      return;
    }
    let boss = await redis.get('Xiuxian:GardenBossPlayer'+ usr_qq);
    boss = JSON.parse(boss);

    //判断换了若陀龙王是否已被击杀，且存在伤害列表信息
    if((await redis.get('Xiuxian:GardenBossStatus'+ boss.Boss_id))){
      e.reply(`若陀龙王${boss.Boss_id}号并未被击杀`);
      return;
    }
    if(!(await redis.get('Xiuxian:GardenRecord'+ boss.Boss_id))){
      e.reply(`若陀龙王${boss.Boss_id}号奖励已经发放过了`);
      return;
    }

    let Boss_List = await Read_Boss_List();
    let bossA;
    for (let i = 0; i < Boss_List.length; i++) {
      bossA = Boss_List[i];
      // 判断 Boss_id 是否等于 'A'
      if (bossA.Boss_id === boss.Boss_id) {
        if(bossA.Boss_item.includes(usr_qq)){
          let bossThing = bossA.Boss_thing;
          //如果Boss_thing为空，则删除全部玩家信息。
          if (bossThing.every(item => item.amount === 0)) {
            for (const item of bossA.Boss_item) {
              await redis.del('Xiuxian:GardenBossPlayer'+ item);
            }
            await redis.del('Xiuxian:GardenRecord'+ boss.Boss_id)
          }
          //展示团本奖励
          let msg = [`若陀龙王${boss.Boss_id}号团本奖励：`];
          let temp_data = {
            temp: msg,
            bossThing: bossThing,
          };
          const data1 = await new Show().get_BossRewardData(temp_data);
          let img = await puppeteer.screenshot('BossReward', {
            ...data1,
          });
          e.reply(img);
        }else{
          e.reply("你并未参与若陀龙王本");
          return;
        }
      }
    }
    return;
  }
  //若陀龙王出价
  async offerGroupBoss(e){
    if (!e.isGroup) {
      return;
    }
    //固定写法
    let usr_qq = e.user_id.toString().replace('qg_','');
    usr_qq = await channel(usr_qq);
    //判断是否为匿名创建存档
    if (usr_qq == 80000000) {
      return;
    }
    //有无存档
    let existPlay = await existplayer(usr_qq);
    if (!existPlay) {
      return;
    }
    let player = await Read_player(usr_qq);

    //判断玩家是否参与击杀若陀龙王
    if(!(await redis.get('Xiuxian:GardenBossPlayer'+ usr_qq))){
      e.reply("你并未参与若陀龙王本");
      return;
    }
    let boss = await redis.get('Xiuxian:GardenBossPlayer'+ usr_qq);
    boss = JSON.parse(boss);
    //判断换了若陀龙王是否已被击杀，且存在伤害列表信息
    if((await redis.get('Xiuxian:GardenBossStatus'+ boss.Boss_id))){
      e.reply(`若陀龙王${boss.Boss_id}号并未被击杀`);
      return;
    }
    if(!(await redis.get('Xiuxian:GardenRecord'+ boss.Boss_id))){
      e.reply(`若陀龙王${boss.Boss_id}号奖励已经发放过了`);
      return;
    }
    //获取团本奖励内容
    let Boss_List = await Read_Boss_List();
    let bossA;
    for (let i = 0; i < Boss_List.length; i++) {
      bossA = Boss_List[i];
      // 判断 Boss_id 是否等于 'A'
      if (bossA.Boss_id === boss.Boss_id) {
        if(bossA.Boss_item.includes(usr_qq)){
          let bossThing = bossA.Boss_thing;
          //如果Boss_thing为空，则删除全部玩家信息。
          if (bossThing.every(item => item.amount === 0)) {
            for (const item of bossA.Boss_item) {
              await redis.del('Xiuxian:GardenBossPlayer'+ item);
            }
            await redis.del('Xiuxian:GardenRecord'+ boss.Boss_id)
            return;
          }
          //获取出价指令
          let thing = e.msg.replace('#若陀龙王出价', '');
          let code = thing.split('*');
          let thing_name = parseInt(code[0]);//物品
          let thing_price = parseInt(code[1]); //价格
          thing_price = await convert2integer(thing_price);

          thing_name = await convert2integer(thing_name);
          thing_name -= 1;
          if(!bossThing[thing_name]){
            e.reply(`不存在编号为${thing_name}的物品`);
            return;
          }
          if (1 == thing_price) {
            thing_price = Math.ceil(bossThing[thing_name].last_price * 1.3);
          } else {
            if (thing_price < bossThing[thing_name].last_price * 1.3) {
              e.reply(`最新价格为${bossThing[thing_name].last_price}，每次加价不少于30 %(${Math.ceil(bossThing[thing_name].last_price * 1.3)})！`);
              return;
            }
          }
          if (player.灵石 < thing_price) {
            e.reply(`本次出价${thing_price},没灵石也想浑水摸鱼?`);
            return;
          }

          let msg = [`${player.名号}:若陀龙王团本编号${thing_name+1}物品${bossThing[thing_name].thing.name}出价${thing_price}`];
          if((bossThing[thing_name].over_time).length === 0){
            bossThing[thing_name].over_time ="1";
          }else{
            let over_time = parseInt(bossThing[thing_name].over_time) + 1;
            bossThing[thing_name].over_time =`${over_time}`;
          }
          bossThing[thing_name].last_price = thing_price;
          bossThing[thing_name].last_player_id = usr_qq;
          bossThing[thing_name].last_player_name = player.名号;
          bossThing[thing_name].now_time = new Date().getTime();
          Boss_List[i].Boss_thing = bossThing;
          await Write_Boss_List(Boss_List);
          /*//展示团本奖励
          let temp_data = {
            temp: msg,
            bossThing: bossThing,
          };
          const data1 = await new Show().get_BossRewardData(temp_data);
          let img = await puppeteer.screenshot('BossReward', {
            ...data1,
          });*/
          e.reply(msg);
          return;
        }else{
          e.reply("你并未参与若陀龙王本");
          return;
        }
      }
    }

  }

  //若陀龙王分配12345
  async choiceGroupBoss(e){
    if (!e.isGroup) {
      return;
    }
    //固定写法
    let usr_qq = e.user_id.toString().replace('qg_','');
    usr_qq = await channel(usr_qq);
    //判断是否为匿名创建存档
    if (usr_qq == 80000000) {
      return;
    }
    //有无存档
    let existPlay = await existplayer(usr_qq);
    if (!existPlay) {
      return;
    }

    //判断玩家是否参与击杀若陀龙王
    if(!(await redis.get('Xiuxian:GardenBossPlayer'+ usr_qq))){
      e.reply("你并未参与若陀龙王本");
      return;
    }
    let boss = await redis.get('Xiuxian:GardenBossPlayer'+ usr_qq);
    boss = JSON.parse(boss);
    //判断换了若陀龙王是否已被击杀，且存在伤害列表信息
    if((await redis.get('Xiuxian:GardenBossStatus'+ boss.Boss_id))){
      e.reply(`若陀龙王${boss.Boss_id}并未被击杀`);
      return;
    }
    if(!(await redis.get('Xiuxian:GardenRecord'+ boss.Boss_id))){
      e.reply(`若陀龙王${boss.Boss_id}奖励已经发放过了`);
      return;
    }
    //获取团本奖励内容
    let Boss_List = await Read_Boss_List();
    let bossA;
    for (let i = 0; i < Boss_List.length; i++) {
      bossA = Boss_List[i];
      // 判断 Boss_id 是否等于 'A'
      if (bossA.Boss_id === boss.Boss_id) {
        if(bossA.Boss_item[0] == (usr_qq)){
          let bossThing = bossA.Boss_thing;
          //如果Boss_thing为空，则删除全部玩家信息。
          if (bossThing.every(item => item.amount === 0)) {
            for (const item of bossA.Boss_item) {
              await redis.del('Xiuxian:GardenBossPlayer'+ item);
            }
            await redis.del('Xiuxian:GardenRecord'+ boss.Boss_id)
            return;
          }

          //获取分配
          let thing = e.msg.replace('#若陀龙王分配', '');
          let code = await getNumversFromString(thing);
          let thing_name = parseInt(code[0]);//物品
          thing_name = await convert2integer(thing_name);
          thing_name -= 1;
          if(!bossThing[thing_name]){
            e.reply(`不存在编号为${thing_name}的物品`);
            return;
          }

          //结算判断物品数量
          if(0 >= bossThing[thing_name].amount){
            e.reply(`物品${bossThing[thing_name].thing.name}已被团长分配`);
            return;
          }
          //如果还没有人出价
          if("0" == bossThing[thing_name].last_player_id){
            e.reply("该物品没人出价，是想让本团长笑纳吗");
            return;
          }

          let player_id = bossThing[thing_name].last_player_id;
          await Add_灵石(player_id,-bossThing[thing_name].last_price);
          await Add_najie_thing(player_id,bossThing[thing_name].thing.name,
              bossThing[thing_name].thing.class,bossThing[thing_name].amount);
          let get_price = Math.floor((bossThing[thing_name].last_price)/bossA.Boss_item.length);
          //将奖励发给参与团本的人
          let msg = [];
          for (let i = 0; i < bossA.Boss_item.length; i++) {
            let item = bossA.Boss_item[i];
            await Add_灵石(item,get_price);
            msg.push(`${item}获得${get_price}灵石。`);
          }

          //将物品数量从奖励中减少
          bossThing[thing_name].amount -= 1;
          Boss_List[i].Boss_thing = bossThing;

          await Write_Boss_List(Boss_List);
          let msg1 = [`若陀龙王团本物品${bossThing[thing_name].thing.name}放入${bossThing[thing_name].last_player_name}纳戒。`];
          msg1.push(msg);
          e.reply(msg1);
          return;
        }else{
          e.reply("只有若陀龙王本团长，可以分配奖励");
          return;
        }
      }
    }

  }


  // //建木
  // async Jianmu(e) {
  //   //不开放私聊功能
  //   if (!e.isGroup) {
  //     return;
  //   }
  //   //检查存档
  // let usr_qq = e.user_id.toString().replace('qg_','');
  // usr_qq = await channel(usr_qq);
  //   let ifexistplay = await existplayer(usr_qq);
  //   if (!ifexistplay) {
  //     return;
  //   }
  //   try {
  //     await Read_fenrao(usr_qq);
  //   } catch {
  //     const arr = {
  //       fnum: 0,//丰饶次数
  //       day: 0,//丰饶日期
  //       month:0,//丰饶月份
  //     };
  //     await Write_fenrao(usr_qq, arr);
  //   }
  //   let fenrao = await Read_fenrao(usr_qq);
  //   let now = new Date();
  //   //获取当前时间戳
  //   let month = now.getMonth() +1 ;
  //   let dat = now.getDate();
  //   if(dat != fenrao.day || month != fenrao.month){
  //     fenrao.day = dat;
  //     fenrao.month = month;
  //     fenrao.fnum = 10;
  //     await Write_fenrao(usr_qq,fenrao);
  //   }
  //   if(0 == fenrao.fnum){
  //     e.reply(`药师今日累了`);
  //     return;
  //   }
  //   //获取建木物品
  //   let msg = e.msg.replace('#建木', '');
  //   let jianmu_Cont = msg.split('*');
  //   //获取物品名
  //   let thing_name = jianmu_Cont[0];
  //   //判断物品是否存在
  //   let thing_WhichOne = data.caoyao_list.find(item => item.name == thing_name);
  //   if (!thing_WhichOne) {
  //     e.reply(`丰饶药师没有[${thing_name}]`);
  //     return;
  //   }
  //   //获取物品数量
  //   let thing_num = await convert2integer(jianmu_Cont[1]);
  //   let player = await Read_player(usr_qq);
  //   let lingshi = player.灵石;
  //   //如果没钱，或者为负数
  //   if (lingshi <= 0) {
  //     e.reply(`没有灵石，丰饶人不让触碰建木！`);
  //     return;
  //   }
  //   //价格
  //   let price = thing_WhichOne.出售价 * 4 * thing_num;
  //   if(thing_name == "绝天白灵芝"){
  //     price = 35000000 * thing_num;
  //   }else if (thing_name == "七彩墨树"){
  //     price = 3000000 * thing_num
  //   }else if (thing_name == "炼骨花"){
  //     price = 200000 * thing_num;
  //   }else if (thing_name == "魔蕴花"){
  //     price = 200000 * thing_num;
  //   }else if (thing_name == "古神藤"){
  //     price = 200000 * thing_num;
  //   }else if (thing_name == "仙蕴花"){
  //     price = 200000 * thing_num;
  //   }else if (thing_name == "仙缘草"){
  //     price = 300000 * thing_num;
  //   }else if (thing_name == "太玄仙草"){
  //     price = 300000 * thing_num;
  //   }
  //   price = Math.trunc(price);
  //   //判断金额
  //   if (lingshi < price) {
  //     e.reply(`还需${price - lingshi}灵石，丰饶人才让触碰建木`);
  //     return;
  //   }
  //   //纳戒交易
  //   fenrao.fnum -= 1;
  //   await Write_fenrao(usr_qq,fenrao);
  //   await Add_najie_thing(usr_qq, thing_name, thing_WhichOne.class, thing_num);
  //   await Add_灵石(usr_qq, -price);
  //   //准备绝灭大君若陀龙王Boss
  //   let Boss_price;
  //   if(!isNotNull(await redis.get('xiuxian:Boss:jue_mie'))){
  //     Boss_price = 0;
  //   }else{
  //     Boss_price = await redis.get('xiuxian:Boss:jue_mie');
  //     Boss_price = JSON.parse(Boss_price);
  //   }
  //   Boss_price += price;
  //   //建木太多，触发绝灭大君
  //   if(Boss_price >= 100000000){
  //     await InitWorldBoss(usr_qq,e);
  //     Boss_price = 0;
  //   }
  //   await redis.set('xiuxian:Boss:jue_mie', JSON.stringify(Boss_price));
  //   //发送消息
  //   e.reply([
  //     `令诸有情，所求皆得，【药师】降下[${thing_name}]*${thing_num},丰饶人获得[${price}]灵石,剩余[${
  //         lingshi - price}]灵石`
  //   ]);
  //   return;
  // }

  // //菜园显示
  // async  Vegetable(e) {
  //   //不开放私聊功能
  //   if (!e.isGroup) {
  //     return;
  //   }
  //       let usr_qq = e.user_id.toString().replace('qg_','');
    // usr_qq = await channel(usr_qq);
  //   let ifexistplay = data.existData('player', usr_qq);

  //   if (!ifexistplay) {
  //     //判断是否有用户档
  //     return;
  //   }

  //   let player = data.getData('player', usr_qq);

  //   if (!isNotNull(player.宗门)) {
  //     return;
  //   }

  //   let ass = data.getAssociation(player.宗门.宗门名称);
  //   if (!isNotNull(player.宗门)) {
  //     return;
  //   } else if (ass.药园.药园等级 == 1 || ass.药园.药园等级 !== ass.宗门等级) {
  //     //加入宗门，没有药园或药园等级不等于宗门等级，则新建药园。
  //     await new_Garden(player.宗门.宗门名称, usr_qq); //新建药园
  //     e.reply('新建药园，种下了一棵草');
  //     ass = data.getAssociation(player.宗门.宗门名称);
  //   }
  //   let zuowu;
  //   let shuliang = ass.宗门等级;
  //   if (shuliang > 6) {
  //     shuliang = 6;
  //   }
  //   let msg = [
  //     `宗门名称: ${ass.宗门名称}` +
  //       '\n' +
  //       `药园可栽种: ${shuliang} 棵药草` +
  //       '\n' +
  //       `药园药草如下:`,
  //   ];
  //   let nowTime = new Date().getTime(); //获取当前时间

  //   for (var i = 0; i < ass.药园.作物.length; i++) {
  //     zuowu = ass.药园.作物;
  //     if (
  //       zuowu[i].name == '天灵花' ||
  //       zuowu[i].name == '皇草' ||
  //       zuowu[i].name == '创世花'
  //     )
  //       continue;
  //     let vegetable_Oldtime = await redis.get(
  //       'xiuxian:' + ass.宗门名称 + zuowu[i].name
  //     ); //获得上次的成熟时间戳,
  //     let chengshu_t = Math.trunc((vegetable_Oldtime - nowTime) / 86400000); //成熟天数
  //     let chengshu_m = Math.trunc(
  //       ((vegetable_Oldtime - nowTime) % 86400000) / 60 / 60 / 1000
  //     ); //成熟小时
  //     let chengshu_s = Math.trunc(
  //       ((vegetable_Oldtime - nowTime) % 3600000) / 60 / 1000
  //     ); //成熟分钟
  //     if (chengshu_t <= 0 && chengshu_m <= 0 && chengshu_s <= 0) {
  //       chengshu_t = 0;
  //       chengshu_m = 0;
  //       chengshu_s = 0;
  //     }
  //     let msg1 = [
  //       `作物: ${zuowu[i].name} ` +
  //         '\n' +
  //         `描述: ${zuowu[i].desc}` +
  //         '\n' +
  //         `成长时间:${chengshu_t}天${chengshu_m}小时${chengshu_s}分钟`,
  //     ];
  //     msg.push(msg1);
  //   }
  //   let temp_data = {
  //     temp: msg
  //   };
  //   const data1 = await new Show().get_tempData(temp_data);
  //   let img = await puppeteer.screenshot('temp', {
  //     ...data1,
  //   });
  //   e.reply(img);
  //   return;
  // }

  // //拔苗助长
  // async Get_vegetable(e){
  //   //不开放私聊功能
  //   if (!e.isGroup) {
  //     return;
  //   }
  // let usr_qq = e.user_id.toString().replace('qg_','');
  // usr_qq = await channel(usr_qq);
  //   let ifexistplay = data.existData('player', usr_qq);
  //   if (!ifexistplay) {
  //     return;
  //   }
  //   let player = data.getData('player', usr_qq);
  //   if (!isNotNull(player.宗门)) {
  //     return;
  //   }
  //   let ass = data.getAssociation(player.宗门.宗门名称);
  //   if (!isNotNull(player.宗门)) {
  //     return;
  //   } else if (ass.药园.药园等级 == 1) {
  //     //加入宗门，没有药园，则新建药园。
  //     e.reply('药园等级太低，可远观不可亵玩焉');
  //     return;
  //   }

  //   //增加cd
  //   let now = new Date();
  //   //获取当前时间戳
  //   let nowTime = now.getTime();
  //   //获得时间戳
  //   let last_garden_time = await redis.get(
  //     'xiuxian:player:' + usr_qq + ':last_garden_time'
  //   );
  //   //
  //   last_garden_time = parseInt(last_garden_time);
  //   var time = this.xiuxianConfigData.CD.garden; //时间（分钟）
  //   let transferTimeout = parseInt(60000 * time); //
  //   if (nowTime < last_garden_time + transferTimeout) {
  //     let waittime_m = Math.trunc(
  //       (last_garden_time + transferTimeout - nowTime) / 60 / 1000
  //     );
  //     let waittime_s = Math.trunc(
  //       ((last_garden_time + transferTimeout - nowTime) % 60000) / 1000
  //     );
  //     e.reply(
  //       `每${transferTimeout / 1000 / 60}分钟拔苗一次。` +
  //         `cd: ${waittime_m}分${waittime_s}秒`
  //     );
  //     return;
  //   }

  //   let vegetable = ass.药园.作物;
  //   let vagetable_name = e.msg.replace('#拔苗助长', '');
  //   for (var i = 0; i < vegetable.length; i++) {
  //     if (vegetable[i].name == vagetable_name) {
  //       let ts = vegetable[i].ts;
  //       let nowTime = new Date().getTime(); //获取当前时间
  //       let vegetable_Oldtime = await redis.get(
  //         'xiuxian:' + ass.宗门名称 + vagetable_name
  //       ); //获得上次的成熟时间戳,
  //       if (nowTime + 1000 * 60 * 30 < vegetable_Oldtime) {
  //         //判断是否成熟
  //         e.reply(
  //           `作物${vagetable_name}增加1800000成熟度,还需要${
  //             vegetable_Oldtime - nowTime - 1000 * 60 * 30
  //           }成熟度`
  //         );
  //         vegetable_Oldtime -= 1000 * 60 * 30; //每次拔苗助长减少 预定成熟的时间
  //         await redis.set(
  //           'xiuxian:' + ass.宗门名称 + vagetable_name,
  //           vegetable_Oldtime
  //         ); //存入缓存
  //         //记录本次获得时间戳
  //         await redis.set(
  //           'xiuxian:player:' + usr_qq + ':last_garden_time',
  //           nowTime
  //         );
  //         return;
  //       } else {
  //         e.reply(
  //           `作物${vagetable_name}已成熟，被${usr_qq}${player.名号}摘取,放入纳戒了`
  //         );
  //         await Add_najie_thing(usr_qq, vagetable_name, '草药', 1);
  //         var vegetable_OutTime = nowTime + 1000 * 60 * 60 * 24 * ts; //设置新一轮成熟时间戳
  //         ass.药园.作物[i].start_time = nowTime; //将当前时间写入药园作物中
  //         await data.setAssociation(ass.宗门名称, ass); //刷新写入作物时间戳
  //         await redis.set(
  //           'xiuxian:' + ass.宗门名称 + vagetable_name,
  //           vegetable_OutTime
  //         ); //存入缓存
  //         //记录本次获得时间戳
  //         await redis.set(
  //           'xiuxian:player:' + usr_qq + ':last_garden_time',
  //           nowTime
  //         );
  //         return;
  //       }
  //     }
  //   }
  //   e.reply('您拔错了吧！掣电树chedianshu');

  //   //记录本次获得时间戳
  //   await redis.set('xiuxian:player:' + usr_qq + ':last_garden_time', nowTime);
  //   return;
  // }
 //查看若陀龙王状态
  async LookUpGroupBossStatus(e) {
    let usr_qq = e.user_id.toString().replace('qg_','');
    usr_qq = await channel(usr_qq);

    //判断玩家是否参与击杀若陀龙王
    if(!(await redis.get('Xiuxian:GardenBossPlayer'+ usr_qq))){
      e.reply("你并未加入任何若陀龙王团本");
      return;
    }
    let Boss_player = await redis.get('Xiuxian:GardenBossPlayer'+ usr_qq);
    Boss_player = JSON.parse(Boss_player);

    if (await BossIsAlive(Boss_player.Boss_id)) {
      let WorldBossStatusStr = await redis.get('Xiuxian:GardenBossStatus'+Boss_player.Boss_id);
      if (WorldBossStatusStr) {
        WorldBossStatusStr = JSON.parse(WorldBossStatusStr);
        let ReplyMsg = [
          `----若陀龙王${Boss_player.Boss_id}号状态----\n攻击:????????????\n防御:????????????\n血量:${WorldBossStatusStr.Health}\n奖励:皮肤,懒狗DD,遣龙令等`,
        ];
        e.reply(ReplyMsg);
      }
    } else{
      e.reply('今日来此，可是来看看我流云借风真君？');
    }
    return true;
  }

  //加入若陀龙王团本
  async IntoGroupBoss(e) {
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    //检查存档
    let usr_qq = e.user_id.toString().replace('qg_','');
    usr_qq = await channel(usr_qq);
    let ifexistplay = await existplayer(usr_qq);
    if (!ifexistplay) {
      return;
    }
    let player_a = await Read_player(usr_qq);
    if (player_a.level_id < 42 && player_a.lunhui == 0) {
      e.reply('仙界之人才可加入讨伐若陀龙王');
      return true;
    }

    //获取若陀龙王编号
    let Long_num = await getNumversFromString(e.msg.toString());
    console.log(Long_num)
    let U_num = Long_num[0];
    //判断该编号是否存在
    if (await BossIsAlive(U_num)) {
      let Boss_List;
      try {
        Boss_List = await Read_Boss_List();
      } catch {
        await Write_Boss_List([]);
        Boss_List = await Read_Boss_List();
      }

      //判断是否已经加入若陀龙王团本
      let boss;
      if(!(await redis.get('Xiuxian:GardenBossPlayer'+ usr_qq))){
      //遍历Boss_list 找到对应id的团本BOSS
        for (let i = 0; i < Boss_List.length; i++) {
          boss = Boss_List[i];
          // 判断 Boss_id 是否等于 'A'
          if (boss.Boss_id === U_num) {
          // 判断 Boss_item 数组是否小于 5
            if (boss.Boss_item.length < 5) {
            // 将 usr_qq 添加到 Boss_item 中
              Boss_List[i].Boss_item.push(usr_qq);
            //重新写入到Boss团本文件中
              await Write_Boss_List(Boss_List);
              await redis.set('Xiuxian:GardenBossPlayer'+ usr_qq, JSON.stringify(boss));
              break;
            }else{
              e.reply(`编号${boss.Boss_id}若陀龙王成员已满`);
              return ;
            }
          }
        }
      }else{
        //已经加入了团本，则显示所在团本
        let Boss_player = await redis.get('Xiuxian:GardenBossPlayer'+ usr_qq);
        Boss_player = JSON.parse(Boss_player);
        boss = Boss_List[Boss_player.Boss_id-1];
      }
      //输出每一个团本成员名单
      let ReplyMsg = [`若陀龙王${boss.Boss_id}号团本成员：`];
      for (let j = 0; j < boss.Boss_item.length; j++) {
       let  player = await Read_player(boss.Boss_item[j]);
        let Power = GetPower(
            player.攻击,
            player.防御,
            player.血量上限,
            player.暴击率,
            player.暴击伤害
        );
        let PowerMini = bigNumberTransform(Power);
        ReplyMsg.push(`${player.名号} 战力：${PowerMini}`);
      }
      e.reply(ReplyMsg);
    } else{
      e.reply(`编号${U_num}的若陀龙王团本不存在！`);
    }
    return true;
  }

  //退出若陀龙王团本
  async OutGroupBoss(e) {
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    //检查存档
    let usr_qq = e.user_id.toString().replace('qg_','');
    usr_qq = await channel(usr_qq);
    let ifexistplay = await existplayer(usr_qq);
    if (!ifexistplay) {
      return;
    }
    let player_a = await Read_player(usr_qq);
    if (player_a.level_id < 42 && player_a.lunhui == 0) {
      e.reply('仙界之人才可加入讨伐若陀龙王');
      return true;
    }


    //判断是否在团本中
    if(!(await redis.get('Xiuxian:GardenBossPlayer'+ usr_qq))){
      e.reply("你并未加入任何若陀龙王团本")
      return;
    }else{
      let cishu=await redis.get('Xiuxian:GardenBossExit'+usr_qq)
      if(cishu==1){
        e.reply('磨损缠身，无法脱身')
        return
      }
      //如果在团本中
      let Boss_List;
      try {
        Boss_List = await Read_Boss_List();
      } catch {
        await Write_Boss_List([]);
        Boss_List = await Read_Boss_List();
      }
      //获取团本BOSSid
      let Boss_player = await redis.get('Xiuxian:GardenBossPlayer'+ usr_qq);
      Boss_player = JSON.parse(Boss_player);
      let boss_num = Boss_player.Boss_id;
      //删除对应id
      if (Boss_List[boss_num - 1] && Boss_List[boss_num - 1].Boss_item) {
        const index = Boss_List[boss_num - 1].Boss_item.indexOf(usr_qq);
        if (index !== -1) {
          Boss_List[boss_num - 1].Boss_item.splice(index, 1);
        }
      }
      cishu=1
      await redis.set('Xiuxian:GardenBossExit'+usr_qq,cishu)

      await Write_Boss_List(Boss_List);
      //删除对应redis
      await redis.del('Xiuxian:GardenBossPlayer'+ usr_qq);
      e.reply(`从若陀龙王团本${boss_num}号退出。`)
    }
  }

  //若陀龙王团本成员
  async GroupBoss(e) {
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    //检查存档
    let usr_qq = e.user_id.toString().replace('qg_','');
    usr_qq = await channel(usr_qq);
    let ifexistplay = await existplayer(usr_qq);
    if (!ifexistplay) {
      return;
    }
    let player_a = await Read_player(usr_qq);
    if (player_a.level_id < 42 && player_a.lunhui == 0) {
      e.reply('仙界之人才可加入讨伐若陀龙王');
      return;
    }
    //判断该编号是否存在
    let Boss_List;
    let  msg =[];
    try {
      Boss_List = await Read_Boss_List();
    } catch {
      await Write_Boss_List([]);
      Boss_List = await Read_Boss_List();
    }
    //获取到amount不为0
    for (var i = 0; i < Boss_List.length; i++) {
      //遍历boss若陀龙王列表
      var bossId = Boss_List[i].Boss_id;
      var bossItems = Boss_List[i].Boss_item;
      var bossThings = Boss_List[i].Boss_thing;
      //判断bossThings的每一个元素的amount是否为0
      var allAmountZero = bossThings.every(function(bossThing) {
        return bossThing.amount === 0;
      });
      //如果不都为0
      if (!allAmountZero) {
        msg.push("若陀龙王" + bossId+"号: " );
        for (var j = 0; j < bossItems.length; j++) {
          let  player = await Read_player(bossItems[j]);
          let Power = GetPower(
              player.攻击,
              player.防御,
              player.血量上限,
              player.暴击率,
              player.暴击伤害
          );
          let PowerMini = bigNumberTransform(Power);
          if (j === 0) {
            msg.push("团长:" + player.名号 + "  战力："+ PowerMini);
          } else {
            msg.push("成员:" + player.名号 + "  战力: " + PowerMini);
          }
        }
      }
    }
    let temp_data = {
      temp: msg,
    };
    const data1 = await new Show().get_tempData(temp_data);
    let img = await puppeteer.screenshot('temp', {
      ...data1,
    });
    e.reply(img);
  }



  //若陀龙王伤害贡献榜
  async ShowGroupDamageList(e) {
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    //检查存档
    let usr_qq = e.user_id.toString().replace('qg_','');
    usr_qq = await channel(usr_qq);
    let existPlay = await existplayer(usr_qq);
    if (!existPlay) {
      return;
    }

    //判断是否已经加入若陀龙王团本
    if(!(await redis.get('Xiuxian:GardenBossPlayer'+ usr_qq))){
      e.reply("你并未加入任何若陀龙王团本");
      return;
    }
    let Boss_player = await redis.get('Xiuxian:GardenBossPlayer'+ usr_qq);
    Boss_player = JSON.parse(Boss_player);

    if (isNotNull(await redis.get('Xiuxian:GardenRecord'+ Boss_player.Boss_id)) ) {
      let PlayerRecord = await redis.get('Xiuxian:GardenRecord'+ Boss_player.Boss_id);
      PlayerRecord = JSON.parse(PlayerRecord);
      let PlayerList = await SortPlayer(PlayerRecord);
      if (!PlayerRecord?.Name) {
        e.reply(`还没人挑战过若陀龙王${Boss_player.Boss_id}号`);
        return true;
      }
      let CurrentQQ;
      let TotalDamage = 0;
      for (
          let i = 0;
          i < (PlayerList.length <= 20 ? PlayerList.length : 20);
          i++
      )
        TotalDamage += PlayerRecord.TotalDamage[PlayerList[i]];
      let msg = [`****若陀龙王${Boss_player.Boss_id}号排行榜****`];
      for (var i = 0; i < PlayerList.length; i++) {
        if (i < 20) {
          let damage = bigNumberTransform(PlayerRecord.TotalDamage[PlayerList[i]]);
          msg.push(
              '第' +
              `${i + 1}` +
              '名:\n' +
              `名号:${PlayerRecord.Name[PlayerList[i]]}` +
              '\n' +
              `总伤害:${damage}`
          );
        }
        if (PlayerRecord.QQ[PlayerList[i]] == usr_qq) CurrentQQ = i + 1;
      }
      if (CurrentQQ){
        let damage_usr = PlayerRecord.TotalDamage[PlayerList[CurrentQQ - 1]];
        let bai_fen = Math.floor((damage_usr/TotalDamage) * 100);
        msg.push(`你在若陀龙王${Boss_player.Boss_id}号团本中贡献排名第${CurrentQQ}，伤害占比${bai_fen}%！`);
      }
      let temp_data = {
        temp: msg
      };
      const data1 = await new Show().get_tempData(temp_data);
      let img = await puppeteer.screenshot('temp', {
        ...data1,
      });
      e.reply(img)
    } else e.reply('今日来此，可是来看看我流云借风真君？');
    return true;
  }

  //与若陀龙王战斗
  async GroupBossBattle(e) {
    if (e.isPrivate) return;
    //检查存档
    let usr_qq = e.user_id.toString().replace('qg_','');
    usr_qq = await channel(usr_qq);
    let existPlay = await existplayer(usr_qq);
    if (!existPlay) {
      return;
    }
    //判断是否加入了团本
    if(!(await redis.get('Xiuxian:GardenBossPlayer'+ usr_qq))){
      e.reply("你并未参与若陀龙王本");
      return;
    }
    let Boss_player = await redis.get('Xiuxian:GardenBossPlayer'+ usr_qq);
    Boss_player = JSON.parse(Boss_player);

    //判断该团本是否还处在
    if (!(await BossIsAlive(Boss_player.Boss_id))) {
      e.reply('你TM脑子是不是抽了，这里哪有什么千年巨魔');
      return true;
    }

    //判断是否是仙人
    if (data.existData('player', usr_qq)) {
      let player = await data.getData('player', usr_qq);
      if (player.level_id < 42 && player.lunhui == 0) {
        e.reply('仙界之人才可讨伐若陀龙王');
        return true;
      }
      // //判断修仙状态
      // let action = await redis.get('xiuxian:player:' + usr_qq + ':action');
      // action = JSON.parse(action);
      // let now_time = new Date().getTime();
      // if (action != null) {
      //   if(null != action.start_time){
      //     let time = now_time - action.start_time
      //     let days = parseInt(time / (1000 * 60 * 60 * 24));
      //     let hours = parseInt((time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      //     let minutes = parseInt((time % (1000 * 60 * 60)) / (1000 * 60));
      //     e.reply(action.action +` ` + days +` 天 `+ hours +` 小时 ` + minutes +` 分钟`);
      //     return;
      //   }else{
      //     if (null != action.end_time){
      //       let action_end_time = action.end_time;
      //       if (now_time <= action_end_time) {
      //         let m = parseInt((action_end_time - now_time) / 1000 / 60);
      //         let s = parseInt((action_end_time - now_time - m * 60 * 1000) / 1000);
      //         e.reply(`正在` + action.action + '中，剩余时间:' + m + '分' + s + '秒');
      //         return;
      //       }
      //     }
      //   }
      // }
    //全局状态判断
    let flag = await Go(e);
    if (!flag) return false;
      //判断血量
      if (player.当前血量 <= player.血量上限 * 0.1) {
        e.reply('体力不支。');
        return true;
      }
      //判断上次攻击若陀龙王时间
      if (WorldBOSSBattleCD[usr_qq]) {
        let Seconds = Math.trunc(
            (300000 - (new Date().getTime() - WorldBOSSBattleCD[usr_qq])) / 1000
        );
        if (Seconds <= 300 && Seconds >= 0) {
          e.reply(
              `先歇息一会儿吧，恢复下状态~(剩余${Seconds}秒)`
          );
          return true;
        }
      }
      //获取若陀龙王状态和收入内容。
      let WorldBossStatusStr = await redis.get('Xiuxian:GardenBossStatus'+ Boss_player.Boss_id);
      let PlayerRecord = await redis.get('Xiuxian:GardenRecord'+ Boss_player.Boss_id);
      let WorldBossStatus = JSON.parse(WorldBossStatusStr);
      let PlayerRecordJSON, Userid;
      if (PlayerRecord == 0) {
        let QQGroup = [],
            DamageGroup = [],
            Name = [];
        //写入id
        QQGroup[0] = usr_qq;
        //写入伤害？
        DamageGroup[0] = 0;
        //写入名号
        Name[0] = player.名号;
        PlayerRecordJSON = {
          QQ: QQGroup,
          TotalDamage: DamageGroup,
          Name: Name,
        };
        Userid = 0;
      } else {
        PlayerRecordJSON = JSON.parse(PlayerRecord);
        let i;
        for (i = 0; i < PlayerRecordJSON.QQ.length; i++) {
          if (PlayerRecordJSON.QQ[i] == usr_qq) {
            Userid = i;
            break;
          }
        }
        //获取你在伤害列表里的下标id
        if (!Userid && Userid != 0) {
          PlayerRecordJSON.QQ[i] = usr_qq;
          PlayerRecordJSON.Name[i] = player.名号;
          PlayerRecordJSON.TotalDamage[i] = 0;
          Userid = i;
        }
      }
      let TotalDamage = 0;
      let Boss = {
        名号: '若陀龙王幻影',
        攻击: parseInt(player.攻击 * (0.8 + 0.6 * Math.random())),
        防御: parseInt(player.防御 * (0.8 + 0.6 * Math.random())),
        当前血量: parseInt(player.血量上限 * (0.8 + 0.6 * Math.random())),
        暴击率: player.暴击率,
        灵根: player.灵根,
        法球倍率: player.灵根.法球倍率,
        hun_Num: 5,
      };
      player.法球倍率 = player.灵根.法球倍率;
      /*      if (WorldBOSSBattleUnLockTimer) clearTimeout(WorldBOSSBattleUnLockTimer);
            await SetWorldBOSSBattleUnLockTimer(e,Boss_player.Boss_id);
            if (WorldBOSSBattleLock[Boss_player.Boss_id] != 0) {
              e.reply('有人正在和若陀龙王作战中，还是等等吧！');
              return true;
            }
            WorldBOSSBattleLock[Boss_player.Boss_id] = 1;*/
      let Data_battle = await zd_battle(player, Boss);
      let msg = Data_battle.msg;
      let A_win = `${player.名号}击败了${Boss.名号}`;
      let B_win = `${Boss.名号}击败了${player.名号}`;
      await sleep(1000);
      if (!WorldBossStatus.Healthmax) {
        e.reply('请联系管理员重新开启!');
        return;
      }
      if (msg.find(item => item == A_win)) {
        TotalDamage = Math.trunc(
            WorldBossStatus.Healthmax * 0.05 +
            Harm(player.攻击 * 0.85, Boss.防御) * 6
        );
        WorldBossStatus.Health -= TotalDamage;
        msg.push(`${player.名号}击败了[${Boss.名号}],重创[若陀龙王${Boss_player.Boss_id}号],造成伤害${TotalDamage}`);
      } else if (msg.find(item => item == B_win)) {
        TotalDamage = Math.trunc(
            WorldBossStatus.Healthmax * 0.03 +
            Harm(player.攻击 * 0.85, Boss.防御) * 4
        );
        WorldBossStatus.Health -= TotalDamage;
        msg.push(`${player.名号}被[${Boss.名号}]击败了,只对[若陀龙王${Boss_player.Boss_id}号]造成了伤害${TotalDamage}`);
      }
      await Add_HP(usr_qq, Data_battle.A_xue);
      await sleep(1000);
      let random = Math.random();
      if (random < 0.05 && msg.find(item => item == A_win)) {
        msg.push('[若陀龙王]吸收仙界灵石，炼化地脉，元素风暴降临，血量回复了50%')
        WorldBossStatus.Health += Math.trunc(WorldBossStatus.Healthmax * 0.5);
      } else if (random > 0.95 && msg.find(item => item == B_win)) {
        TotalDamage += Math.trunc(WorldBossStatus.Health * 0.15);
        WorldBossStatus.Health -= Math.trunc(WorldBossStatus.Health * 0.15);
        msg.push(`危及时刻,懒狗DD睡醒了，@了小梦，小梦使出！金光雷电对[若陀龙王]造成${Math.trunc(
            WorldBossStatus.Health * 0.15
        )}伤害,并治愈了你的伤势`);
        await Add_HP(usr_qq, player.血量上限);
      }

      let temp_data = {
        temp: msg
      };
      const data1 = await new Show().get_battleData(temp_data);
      let img = await puppeteer.screenshot('battle', {
        ...data1,
      });
      e.reply(img);

      await sleep(1000);
      PlayerRecordJSON.TotalDamage[Userid] += TotalDamage;
      redis.set('Xiuxian:GardenRecord'+ Boss_player.Boss_id, JSON.stringify(PlayerRecordJSON));
      redis.set('Xiuxian:GardenBossStatus'+ Boss_player.Boss_id, JSON.stringify(WorldBossStatus));
      //如果击败了若陀龙王
      if (WorldBossStatus.Health <= 0) {
        e.reply(`${player.名号} 终结了[若陀龙王]。小梦降下了若干奖励！请查看团本掉落。`);
        await Add_najie_thing(usr_qq,"起死回生丹","丹药",5);
        //清除redis中对应编号的若陀龙王信息但不删除战斗结果信息
        /*await redis.del('Xiuxian:GardenRecord'+ Boss_player.Boss_id);*/
        await redis.del('Xiuxian:GardenBossStatus'+ Boss_player.Boss_id);
      }

      WorldBOSSBattleCD[usr_qq] = new Date().getTime();
/*      WorldBOSSBattleLock[Boss_player.Boss_id] = 0;*/
      return true;
    } else {
      e.reply('凡人你僭越了，也想讨伐【若陀龙王】？');
      return true;
    }
  }
}



// /**
//  * 创立新的药园
//  * @param name 宗门名称
//  * @param user_qq qq号
//  */
// async function new_Garden(association_name, user_qq) {
//   let now = new Date();
//   let nowTime = now.getTime(); //获取当前时间戳
//   let date = timestampToTime(nowTime);
//   let ass = data.getAssociation(association_name);
//   let AssociationGarden;
//   //怎么直接写这里而不是调用文件
//   if (ass.宗门等级 == 9) {
//     AssociationGarden = {
//       药园等级: 9,
//       作物: [
//         {
//           name: '凝血草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 1,
//           desc: '汲取了地脉灵气形成的草',
//         },
//         {
//           name: '掣电树',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 2,
//           desc: '汲取了地脉灵气的巨大藤蔓形成的草树。\n从树冠中源源不断释放出电力，隐隐有着雷光闪烁。\n5米内禁止玩火，雷火反应发生爆炸',
//         },
//         {
//           name: '小吉祥草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 3,
//           desc: '小吉祥草的护佑，拥有抵御雷劫的力量',
//         },
//         {
//           name: '大吉祥草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 7,
//           desc: '大吉祥草的护佑',
//         },
//         {
//           name: '仙草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 7,
//           desc: '仙草',
//         },
//         {
//           name: '龙火',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 7,
//           desc: '龙火，不详',
//         },
//       ],
//     };
//   } else if (ass.宗门等级 == 8) {
//     AssociationGarden = {
//       药园等级: 8,
//       作物: [
//         {
//           name: '凝血草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 1,
//           desc: '汲取了地脉灵气形成的草',
//         },
//         {
//           name: '掣电树',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 2,
//           desc: '汲取了地脉灵气的巨大藤蔓形成的草树。\n从树冠中源源不断释放出电力，隐隐有着雷光闪烁。\n5米内禁止玩火，雷火反应发生爆炸',
//         },
//         {
//           name: '小吉祥草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 3,
//           desc: '小吉祥草的护佑，拥有抵御雷劫的力量',
//         },
//         {
//           name: '大吉祥草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 7,
//           desc: '大吉祥草的护佑',
//         },
//         {
//           name: '仙草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 7,
//           desc: '仙草',
//         },
//         {
//           name: '龙火',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 7,
//           desc: '龙火，不详',
//         },
//       ],
//     };
//   } else if (ass.宗门等级 == 7) {
//     AssociationGarden = {
//       药园等级: 7,
//       作物: [
//         {
//           name: '凝血草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 1,
//           desc: '汲取了地脉灵气形成的草',
//         },
//         {
//           name: '掣电树',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 2,
//           desc: '汲取了地脉灵气的巨大藤蔓形成的草树。\n从树冠中源源不断释放出电力，隐隐有着雷光闪烁。\n5米内禁止玩火，雷火反应发生爆炸',
//         },
//         {
//           name: '小吉祥草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 3,
//           desc: '小吉祥草的护佑，拥有抵御雷劫的力量',
//         },
//         {
//           name: '大吉祥草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 7,
//           desc: '大吉祥草的护佑',
//         },
//         {
//           name: '仙草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 7,
//           desc: '仙草',
//         },
//         {
//           name: '龙火',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 7,
//           desc: '龙火，不详',
//         },
//       ],
//     };
//   } else if (ass.宗门等级 == 6) {
//     AssociationGarden = {
//       药园等级: 6,
//       作物: [
//         {
//           name: '凝血草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 1,
//           desc: '汲取了地脉灵气形成的草',
//         },
//         {
//           name: '掣电树',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 2,
//           desc: '汲取了地脉灵气的巨大藤蔓形成的草树。\n从树冠中源源不断释放出电力，隐隐有着雷光闪烁。\n5米内禁止玩火，雷火反应发生爆炸',
//         },
//         {
//           name: '小吉祥草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 3,
//           desc: '小吉祥草的护佑，拥有抵御雷劫的力量',
//         },
//         {
//           name: '大吉祥草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 7,
//           desc: '大吉祥草的护佑',
//         },
//         {
//           name: '仙草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 7,
//           desc: '仙草',
//         },
//         {
//           name: '龙火',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 7,
//           desc: '龙火，不详',
//         },
//       ],
//     };
//   } else if (ass.宗门等级 == 5) {
//     AssociationGarden = {
//       药园等级: 5,
//       作物: [
//         {
//           name: '凝血草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 1,
//           desc: '汲取了地脉灵气形成的草',
//         },
//         {
//           name: '掣电树',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 2,
//           desc: '汲取了地脉灵气的巨大藤蔓形成的草树。\n从树冠中源源不断释放出电力，隐隐有着雷光闪烁。\n5米内禁止玩火，雷火反应发生爆炸',
//         },
//         {
//           name: '小吉祥草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 3,
//           desc: '小吉祥草的护佑，拥有抵御雷劫的力量',
//         },
//         {
//           name: '大吉祥草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 7,
//           desc: '大吉祥草的护佑',
//         },
//         {
//           name: '仙草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 7,
//           desc: '仙草',
//         },
//       ],
//     };
//   } else if (ass.宗门等级 == 4) {
//     AssociationGarden = {
//       药园等级: 4,
//       作物: [
//         {
//           name: '凝血草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 1,
//           desc: '汲取了地脉灵气形成的草',
//         },
//         {
//           name: '掣电树',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 2,
//           desc: '汲取了地脉灵气的巨大藤蔓形成的草树。\n从树冠中源源不断释放出电力，隐隐有着雷光闪烁。\n5米内禁止玩火，雷火反应发生爆炸',
//         },
//         {
//           name: '小吉祥草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 3,
//           desc: '小吉祥草的护佑，拥有抵御雷劫的力量',
//         },
//         {
//           name: '大吉祥草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 7,
//           desc: '大吉祥草的护佑',
//         },
//       ],
//     };
//   } else if (ass.宗门等级 == 3) {
//     AssociationGarden = {
//       药园等级: 3,
//       作物: [
//         {
//           name: '凝血草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 1,
//           desc: '汲取了地脉灵气形成的草',
//         },
//         {
//           name: '掣电树',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 2,
//           desc: '汲取了地脉灵气的巨大藤蔓形成的草树。\n从树冠中源源不断释放出电力，隐隐有着雷光闪烁。\n5米内禁止玩火，雷火反应发生爆炸',
//         },
//         {
//           name: '小吉祥草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 3,
//           desc: '小吉祥草的护佑，拥有抵御雷劫的力量',
//         },
//       ],
//     };
//   } else if (ass.宗门等级 == 2) {
//     AssociationGarden = {
//       药园等级: 2,
//       作物: [
//         {
//           name: '凝血草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 1,
//           desc: '汲取了地脉灵气形成的草',
//         },
//         {
//           name: '掣电树',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 2,
//           desc: '汲取了地脉灵气的巨大藤蔓形成的草树。\n从树冠中源源不断释放出电力，隐隐有着雷光闪烁。\n5米内禁止玩火，雷火反应发生爆炸',
//         },
//       ],
//     };
//   } else if (ass.宗门等级 == 1) {
//     AssociationGarden = {
//       药园等级: 1,
//       作物: [
//         {
//           name: '凝血草',
//           start_time: nowTime,
//           who_plant: user_qq,
//           ts: 1,
//           desc: '汲取了地脉灵气形成的草',
//         },
//       ],
//     };
//   }

//   ass.药园 = AssociationGarden;
//   data.setAssociation(association_name, ass);
//   //let ass = data.getAssociation(holder_qq);
//   return;
// }

/**
 * 判断对象是否不为undefined且不为null
 * @param obj 对象
 * @returns obj==null/undefined,return false,other return true
 */
function isNotNull(obj) {
  if (obj == undefined || obj == null) return false;
  return true;
}

//对象数组排序
function sortBy(field) {
  //从大到小,b和a反一下就是从小到大
  return function (b, a) {
    return a[field] - b[field];
  };
}


//获取玩家大道真仙实力以上人数
async function GetAverageDamage() {
  let File = fs.readdirSync(data.filePathMap.player);
  File = File.filter(file => file.endsWith('.json'));
  let temp = [];
  let TotalPlayer = 0;
  for (var i = 0; i < File.length; i++) {
    let this_qq = File[i].replace('.json', '');
    let player = await data.getData('player', this_qq);
    let level_id = data.Level_list.find(
        item => item.level_id == player.level_id
    ).level_id;
    if (level_id >= 30){
      temp[TotalPlayer] = parseInt(player.攻击);
      TotalPlayer++;
    }
  }
  //排序
  temp.sort(function (a, b) {
    return b - a;
  });
  let AverageDamage = 0;
  if (TotalPlayer > 15)
    for (let i = 1; i < temp.length; i++) AverageDamage += temp[i];
  else for (let i = 0; i < temp.length; i++) AverageDamage += temp[i];
  AverageDamage =
      TotalPlayer > 15
          ? AverageDamage / (temp.length - 1)
          : temp.length == 0
              ? 0
              : AverageDamage / temp.length;
  //得到平均伤害和人数
  let res = {
    AverageDamage: AverageDamage*10,
    player_quantity: TotalPlayer,
  };
  return res;
}

//获取编号ID的若陀龙王是否存在
async function BossIsAlive(Boss_id) {

  console.log(await redis.get('Xiuxian:GardenBossStatus'+ Boss_id))
  console.log(await redis.get('Xiuxian:GardenRecord'+ Boss_id))
  return (
      (await redis.get('Xiuxian:GardenBossStatus'+ Boss_id)) &&
      (await redis.get('Xiuxian:GardenRecord'+ Boss_id))
  );
}
//排序
async function SortPlayer(PlayerRecordJSON) {
  if (PlayerRecordJSON) {
    let Temp0 = JSON.parse(JSON.stringify(PlayerRecordJSON));
    let Temp = Temp0.TotalDamage;
    let SortResult = [];
    Temp.sort(function (a, b) {
      return b - a;
    });
    for (let i = 0; i < PlayerRecordJSON.TotalDamage.length; i++) {
      for (let s = 0; s < PlayerRecordJSON.TotalDamage.length; s++) {
        if (Temp[i] == PlayerRecordJSON.TotalDamage[s]) {
          SortResult[i] = s;
          break;
        }
      }
    }
    return SortResult;
  }
}

//设置防止锁卡死的计时器
/*async function SetWorldBOSSBattleUnLockTimer(e,Boss_id) {
  WorldBOSSBattleUnLockTimer = setTimeout(() => {
    if (WorldBOSSBattleLock[Boss_id] == 1) {
      WorldBOSSBattleLock[Boss_id] = 0;
      e.reply('若陀龙王唤起了BUG的力量，再度归来');
      return true;
    }
  }, 30000);
}*/

//sleep
async function sleep(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}

//随机获得若陀龙王物品
async function RandomGood() {
  let amount=1

  let goods = data.GroupBossReward_list[0].one;

  const random = Math.floor(Math.random() * goods.length);

  let good = goods[random]

  const thing_data = good;
  const thing_price = Math.floor(thing_data.出售价);
  const now_time = new Date().getTime();

  const wupin = {
    thing: thing_data,
    last_price: thing_price,
    amount: amount,
    now_time: now_time,
    over_time: '',
    list_num: 0,
    last_player_id: '0',
    last_player_name:'',
  };
  return wupin;
}
//初始化龙王
export async function InitWorldBoss(usr_qq) {
  let AverageDamageStruct = await GetAverageDamage();
  let player_quantity = AverageDamageStruct.player_quantity;
  let AverageDamage = AverageDamageStruct.AverageDamage;
  //人数
  let Reward = 5;
  if (player_quantity == 0) {
    return -1;
  }
  //查找BOSS的ID号
  let Boss_List;
  try {
    Boss_List = await Read_Boss_List();
  } catch {
    await Write_Boss_List([]);
    Boss_List = await Read_Boss_List();
  }
  //生成奖励

  let BOSS_Long_thing = [];
  for(let i = 0; i < 5; i++){
    let thing = await RandomGood();
    thing.list_num = i + 1;
    BOSS_Long_thing.push(thing);
  }

  let Boss_id = 1;
  let Boss = {
    Boss_id:Boss_id,
    Boss_name:"若陀龙王",
    Boss_time:new Date().getTime(),
    Boss_item:[usr_qq],
    Boss_thing:BOSS_Long_thing,
  }
  if(Boss_List.length === 0){
    Boss_List.push(Boss);
  }else {
    Boss_id = Boss_List.length +1;
    //如果已经加入若陀龙王团本了，则新团本不加入。
    if(!(await redis.get('Xiuxian:GardenBossPlayer' + usr_qq))){
      Boss = {
        Boss_id:Boss_id,
        Boss_name:"若陀龙王",
        Boss_time:new Date().getTime(),
        Boss_item:[usr_qq],
        Boss_thing:BOSS_Long_thing,
      };
    }else{
      Boss = {
        Boss_id:Boss_id,
        Boss_name:"若陀龙王",
        Boss_time:new Date().getTime(),
        Boss_item:[],
        Boss_thing:BOSS_Long_thing,
      };
    }
    Boss_List.push(Boss);
  }
/*  WorldBOSSBattleLock[Boss_id] = 0;*/
  //在redis写入创建者的若陀龙王BOSS状况
  //如果已经加入若陀龙王团本了，则新团本不加入。
  if(!(await redis.get('Xiuxian:GardenBossPlayer' + usr_qq))){
    await redis.set('Xiuxian:GardenBossPlayer' + usr_qq, JSON.stringify(Boss));
  }

  if (player_quantity < 5) player_quantity = 5;
  let Health = Math.trunc(AverageDamage  * player_quantity * 5); //血量要根据人数来
  let WorldBossStatus = {
    Boss_id:Boss_id,
    Health: Health,
    Healthmax: Health,
    KilledTime: -1,
    Reward: Reward,
  };
  let PlayerRecord = 0;
  
  await Write_Boss_List(Boss_List);
  await redis.set('Xiuxian:GardenBossStatus'+ Boss_id, JSON.stringify(WorldBossStatus));
  await redis.set('Xiuxian:GardenRecord'+ Boss_id, JSON.stringify(PlayerRecord));
  
  return ;
}
