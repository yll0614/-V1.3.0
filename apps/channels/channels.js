import fs from 'fs';
import { plugin, common, config, data } from '../../api/api.js';
import path from 'path';
import {__PATH, sleep} from '../../model/xiuxian.js';
import { existplayer,  Read_Exchange,
  Write_Exchange,Write_Forum,
  Read_Forum,  Read_qinmidu,
  Write_qinmidu,Read_channel,Write_channel,fstadd_channel,isNotNull,  Read_player,

  Add_najie_thing,
  Add_修为,
  Add_血气,
  Add_HP,
  Read_danyao,
  Write_danyao,
  zd_battle, 
  get_log_img,
  exist_najie_thing,
  Write_player} from '../../model/xiuxian.js';
import{Read_tripod,Write_duanlu}from'../../model/duanzaofu.js'
import { AppName } from '../../app.config.js';



export class channels extends plugin {
    constructor() {
      super({
        name: 'Yunzai_Bot_AdminSuper',
        dsc: '修仙设置',
        event: 'message',
        priority: 100,
        rule: [
          {
            reg: '^#把所有频道存档撤回来',
            fnc: 'conversion',
          },
          {
            reg: '^#发起频道绑定',
            fnc: 'send',
          },
          {
            reg:"#接受频道绑定.*$",
            fnc:'reception',
          },
          {
            reg:"#秘境结算",
            fnc:'regression',
          },
          {
            reg:"请私信发我一条消息",
            fnc:'cs',
          },
          {
            reg:"cs",
            fnc:'cs2',
          },
        ],
      });
    }
    async cs(e){
      await common.relpyPrivate(e.user_id.toString(), '你干嘛');
    }
    async cs2(e){
      console.log(e)
      e.reply(e.user_id.toString().replace('qg_',''))
    }
    async regression(e){
      let player_id=e.user_id.toString().replace('qg_','')
      let ifexistplay = await existplayer(player_id);
      if (!ifexistplay){;
          e.reply("当前位面无存档")
          return false
        }

        let action = await redis.get('xiuxian:player:' + player_id + ':action');
        action = await JSON.parse(action);
      //不为空，存在动作
      if (action != null) {


        //最后发送的消息
        let msg = [];
        //动作结束时间
        let end_time = action.end_time;
        //现在的时间
        let now_time = new Date().getTime();
        //用户信息
        let player = await Read_player(player_id);
        //有秘境状态:这个直接结算即可
        if (action.Place_action == '0') {//降临
          //这里改一改,要在结束时间的前两分钟提前结算
          end_time = end_time - 60000 * 2;
          //时间过了
          if (now_time > end_time 
            || player_id=='4909071520328015562') {
            let weizhi = action.Place_address;
            let A_player = {
              名号: player.名号,
              攻击: player.攻击,
              防御: player.防御,
              当前血量: player.当前血量,
              暴击率: player.暴击率,
              法球倍率: player.灵根.法球倍率,
              仙宠: player.仙宠,
            };
            let buff = 1;
            if (weizhi.name == '大千世界' || weizhi.name == '仙界矿场')
              buff = 0.6;
            let monster_length = data.monster_list.length;
            let monster_index = Math.trunc(Math.random() * monster_length);
            let monster = data.monster_list[monster_index];
            let B_player = {
              名号: monster.名号,
              攻击: parseInt(monster.攻击 * player.攻击 * buff),
              防御: parseInt(monster.防御 * player.防御 * buff),
              当前血量: parseInt(monster.当前血量 * player.血量上限 * buff),
              暴击率: monster.暴击率 * buff,
              法球倍率: 0.1,
            };
            let Data_battle = await zd_battle(A_player, B_player);
            let msgg = Data_battle.msg;
            let A_win = `${A_player.名号}击败了${B_player.名号}`;
            let B_win = `${B_player.名号}击败了${A_player.名号}`;
            var thing_name;
            var thing_class;
            const cf = config.getConfig('xiuxian', 'xiuxian');
            var x = cf.SecretPlace.one;
            let random1 = Math.random();
            var y = cf.SecretPlace.two;
            let random2 = Math.random();
            var z = cf.SecretPlace.three;
            let random3 = Math.random();
            let random4;
            var m = '';
            let fyd_msg = '';
            //查找秘境
            let t1;
            let t2;
            var n = 1;
            let last_msg = '';
            if (random1 <= x) {
              if (random2 <= y) {
                if (random3 <= z) {
                  random4 = Math.floor(Math.random() * weizhi.three.length);
                  thing_name = weizhi.three[random4].name;
                  thing_class = weizhi.three[random4].class;
                  m = `抬头一看，金光一闪！有什么东西从天而降，定睛一看，原来是：[${thing_name}`;
                  t1 = 2 + Math.random();
                  t2 = 2 + Math.random();
                } else {
                  random4 = Math.floor(Math.random() * weizhi.two.length);
                  thing_name = weizhi.two[random4].name;
                  thing_class = weizhi.two[random4].class;
                  m = `在洞穴中拿到[${thing_name}`;
                  t1 = 1 + Math.random();
                  t2 = 1 + Math.random();
                  if (weizhi.name == '太极之阳' || weizhi.name == '太极之阴') {
                    n = 5;
                    m = '捡到了[' + thing_name;
                  }
                }
              } else {
                random4 = Math.floor(Math.random() * weizhi.one.length);
                thing_name = weizhi.one[random4].name;
                thing_class = weizhi.one[random4].class;
                m = `捡到了[${thing_name}`;
                t1 = 0.5 + Math.random() * 0.5;
                t2 = 0.5 + Math.random() * 0.5;
                if (weizhi.name == '诸神黄昏·旧神界') {
                  n = 1;
                  if (thing_name == '洗根水') n = 130;
                  if (thing_name == '冰心丹') n = 80;
                  if (thing_name == '大力丸') n = 80;
                  if (thing_name == '七彩墨树') n = 5;
                  m = '捡到了[' + thing_name;
                }
                
                if (weizhi.name == '太极之阳' || weizhi.name == '太极之阴') {
                  n = 5;
                  m = '捡到了[' + thing_name;
                }
              }
            } else {
              m = '走在路上看见了一只蚂蚁！蚂蚁大仙送了你[起死回生丹';
              await Add_najie_thing(player_id, '起死回生丹', '丹药', 1);
              t1 = 0.5 + Math.random() * 0.5;
              t2 = 0.5 + Math.random() * 0.5;
            }

            if (weizhi.name != '诸神黄昏·旧神界' && weizhi.name != '界海尽头') {
              //判断是不是旧神界
              let random = Math.random();
              if (random < player.幸运) {
                if (random < player.addluckyNo) {
                  last_msg += '福源丹生效，所以在';
                } else if (player.仙宠.type == '幸运') {
                  last_msg += '仙宠使你在探索中欧气满满，所以在';
                }
                n *= 2;
                last_msg += '本次探索中获得赐福加成\n';
              }
              if (player.islucky > 0) {
                player.islucky--;
                if (player.islucky != 0) {
                  fyd_msg = `  \n福源丹的效力将在${player.islucky}次探索后失效\n`;
                } else {
                  fyd_msg = `  \n本次探索后，福源丹已失效\n`;
                  player.幸运 -= player.addluckyNo;
                  player.addluckyNo = 0;
                }
                data.setData('player', player_id, player);
              }
            }
            m += `]×${n}个。`;
            let xiuwei = 0;
            //默认结算装备数
            let now_level_id;
            let now_physique_id;
            now_level_id = player.level_id;
            now_physique_id = player.Physique_id;
            //结算
            let qixue = 0;
            if (msgg.find(item => item == A_win)) {
              xiuwei = Math.trunc(
                2000 + (100 * now_level_id * now_level_id * t1 * 0.1) / 5
              );
              qixue = Math.trunc(
                2000 + 100 * now_physique_id * now_physique_id * t2 * 0.1
              );
              if (thing_name) {
                await Add_najie_thing(player_id, thing_name, thing_class, n);
              }
              last_msg += `${m}不巧撞见[${
                B_player.名号
              }],经过一番战斗,击败对手,获得修为${xiuwei},气血${qixue},剩余血量${
                A_player.当前血量 + Data_battle.A_xue
              }`;
              let random = Math.random(); //万分之一出神迹
              let newrandom = 0.995;
              let dy = await Read_danyao(player_id);
              newrandom -= dy.beiyong1;
              if (dy.ped > 0) {
                dy.ped--;
              } else {
                dy.beiyong1 = 0;
                dy.ped = 0;
              }
              await Write_danyao(player_id, dy);
              if (random > newrandom) {
                let length = data.xianchonkouliang.length;
                let index = Math.trunc(Math.random() * length);
                let kouliang = data.xianchonkouliang[index];
                last_msg +=
                  '\n七彩流光的神奇仙谷[' +
                  kouliang.name +
                  ']深埋在土壤中，是仙兽们的最爱。';
                await Add_najie_thing(player_id, kouliang.name, '仙宠口粮', 1);
              }
              let random_pifu= Math.random()
              if(random_pifu>0.999999){
                if(najie_random>0.5){
                  let length_najie=data.kamian.length
                  let index_najie=Math.trunc(Math.random() * length_najie);
                  let Get_najie=data.kamian[index_najie]
                  last_msg +=
                  '\n历经九九八十一难，在历练中练就出了一道玄影[' +
                  Get_najie.name +
                  ']';
                  await Add_najie_thing(player_id, Get_najie.name, '道具', 1);
                }else{
                  let length_lianqi=data.kamian3.length
                  let index_lianqi=Math.trunc(Math.random() * length_lianqi);
                  let Get_lianqi=data.kamian3[index_lianqi]
                  last_msg +=
                  '\n历经九九八十一难，在历练中练就出了一道玄影[' +
                  Get_lianqi.name +
                  ']';
                  await Add_najie_thing(player_id, Get_lianqi.name, '道具', 1);
                }
              }
              if (random > 0.1 && random < 0.1002) {
                last_msg +=
                  '\n' +
                  B_player.名号 +
                  '倒下后,你正准备离开此地，看见路边草丛里有个长相奇怪的石头，顺手放进了纳戒。';
                await Add_najie_thing(player_id, '长相奇怪的小石头', '道具', 1);
              }
            } else if (msgg.find(item => item == B_win)) {
              xiuwei = 800;
              last_msg =
                '不巧撞见[' +
                B_player.名号 +
                '],经过一番战斗,败下阵来,还好跑得快,只获得了修为' +
                xiuwei +
                ']';
            }
            msg.push('\n' + player.名号 + last_msg + fyd_msg);
            let arr = action;
            //把状态都关了
            arr.shutup = 1; //闭关状态
            arr.working = 1; //降妖状态
            arr.power_up = 1; //渡劫状态
            arr.Place_action = 1; //秘境
            arr.Place_actionplus = 1; //沉迷状态
            //结束的时间也修改为当前时间
            arr.end_time = new Date().getTime();
            //结算完去除group_id
            delete arr.group_id;
            //写入redis
            await redis.set(
              'xiuxian:player:' + player_id + ':action',
              JSON.stringify(arr)
            );
            //先完结再结算
            await Add_血气(player_id, qixue);
            await Add_修为(player_id, xiuwei);
            await Add_HP(player_id, Data_battle.A_xue);
            //发送消息
            e.reply(await get_log_img(msg))
          }else{
            e.reply("未到时候")
            return
          }
        }else if (action.Place_actionplus == '0') {//沉迷
          //这里改一改,要在结束时间的前两分钟提前结算
          // end_time = end_time - action.time;
          //时间过了

          if (now_time > end_time || player_id=='4909071520328015562') {

            let msg_last={}
            let loss=0
            let fyd_msg=''
            let cishu=action.cishu
            while(action.cishu>0){
            

           
            let weizhi = action.Place_address;


            if (player.当前血量 < 0.3 * player.血量上限) {
              if (await exist_najie_thing(player_id, '起死回生丹', '丹药')) {
                player.当前血量 = player.血量上限;
                await Add_najie_thing(player_id, '起死回生丹', '丹药', -1);
                await Write_player(player_id, player);
              }
            }
            let A_player = {
              名号: player.名号,
              攻击: player.攻击,
              防御: player.防御,
              当前血量: player.当前血量,
              暴击率: player.暴击率,
              法球倍率: player.灵根.法球倍率,
            };
            let monster_length = data.monster_list.length;
            let monster_index = Math.trunc(Math.random() * monster_length);
            let monster = data.monster_list[monster_index];
            let B_player = {
              名号: monster.名号,
              攻击: parseInt(monster.攻击 * player.攻击),
              防御: parseInt(monster.防御 * player.防御),
              当前血量: parseInt(monster.当前血量 * player.血量上限),
              暴击率: monster.暴击率,
              法球倍率: 0.1,
            };
            let Data_battle = await zd_battle(A_player, B_player);
            let msgg = Data_battle.msg;
            let A_win = `${A_player.名号}击败了${B_player.名号}`;
            let B_win = `${B_player.名号}击败了${A_player.名号}`;
            var thing_name;
            var thing_class;
            const cf = config.getConfig('xiuxian', 'xiuxian');
            var x = cf.SecretPlace.one;
            let random1 = Math.random();
            var y = cf.SecretPlace.two;
            let random2 = Math.random();
            var z = cf.SecretPlace.three;
            let random3 = Math.random();
            let random4;
            var m = '';
            let fyd_msg = '';
            //查找秘境
            let t1;
            let t2;
            let r = 0;
            for (let i = 0; i < 5; i++) {
              if (Math.random() < 1 / 2) {
                r++;
              } else {
                break;
              }
            }

            var n = 1;
            let last_msg = '';
            if (random1 <= x) {
              if (random2 <= y) {
                //random2=0到1随机数,y=0.6
                if (random3 <= z) {
                  random4 = Math.floor(Math.random() * weizhi.three.length);
                  thing_name = weizhi.three[random4].name;
                  thing_class = weizhi.three[random4].class;
                  m = `抬头一看，金光一闪！有什么东西从天而降，定睛一看，原来是：[${thing_name}`;
                  t1 = 2 + Math.random();
                  t2 = 2 + Math.random();
                } else {
                  random4 = Math.floor(Math.random() * weizhi.two.length);
                  thing_name = weizhi.two[random4].name;
                  thing_class = weizhi.two[random4].class;
                  m = `在洞穴中拿到[${thing_name}`;
                  t1 = 1 + Math.random();
                  t2 = 1 + Math.random();
                  if (weizhi.name == '太极之阳' || weizhi.name == '太极之阴') {
                    n = 5;
                    m = '捡到了[' + thing_name;
                  }
                }
              } else {
                random4 = Math.floor(Math.random() * weizhi.one.length);
                thing_name = weizhi.one[random4].name;
                thing_class = weizhi.one[random4].class;
                m = `捡到了[${thing_name}`;
                t1 = 0.5 + Math.random() * 0.5;
                t2 = 0.5 + Math.random() * 0.5;
                if (weizhi.name == '诸神黄昏·旧神界') {
                  n = 1;
                  if (thing_name == '洗根水') n = 130;
                     if (thing_name == '冰心丹') n = 80;
                  if (thing_name == '大力丸') n = 80;
                  if (thing_name == '七彩墨树') n = 5;
                  m = '捡到了[' + thing_name;
                }
                if (weizhi.name == '太极之阳' || weizhi.name == '太极之阴') {
                  n = 5;
                  m = '捡到了[' + thing_name;
                }
              }
            } else {
              m = '走在路上看见了一只蚂蚁！蚂蚁大仙送了你[起死回生丹';
              await Add_najie_thing(player_id, '起死回生丹', '丹药', 1);
              t1 = 0.5 + Math.random() * 0.5;
              t2 = 0.5 + Math.random() * 0.5;
            }
            if (weizhi.name != '诸神黄昏·旧神界' && weizhi.name != '界海尽头') {
              //判断是不是旧神界
              let random = Math.random();
              if (random < player.幸运) {
                if (random < player.addluckyNo) {
                  last_msg += '福源丹生效，所以在';
                } else if (player.仙宠.type == '幸运') {
                  last_msg += '仙宠使你在探索中欧气满满，所以在';
                }
                n *= 2;
                last_msg +=
                  '探索过程中意外发现了两份机缘,最终获取机缘数量将翻倍\n';
              }
              if (player.islucky > 0) {
                player.islucky--;
                if (player.islucky != 0) {
                  fyd_msg = `  \n福源丹的效力将在${player.islucky}次探索后失效\n`;
                } else {
                  fyd_msg = `  \n本次探索后，福源丹已失效\n`;
                  player.幸运 -= player.addluckyNo;
                  player.addluckyNo = 0;
                }
                data.setData('player', player_id, player);
              }
            }
            m += `]×${n}个。`;
            let xiuwei = 0;
            //默认结算装备数
            let now_level_id;
            let now_physique_id;
            now_level_id = player.level_id;
            now_physique_id = player.Physique_id;
            //结算
            let qixue = 0;
            if (msgg.find(item => item == A_win)) {
              xiuwei = Math.trunc(
                2000 + (100 * now_level_id * now_level_id * t1 * 0.1) / 5
              );
              qixue = Math.trunc(
                2000 + 100 * now_physique_id * now_physique_id * t2 * 0.1
              );
              if (thing_name) {


                if(isNotNull(msg_last[thing_name])){
                  msg_last[thing_name]+=n
                }else{
                  msg_last[thing_name]=n
                }
                
                await Add_najie_thing(player_id, thing_name, thing_class, n);
              }
              last_msg += `${m}不巧撞见[${
                B_player.名号
              }],经过一番战斗,击败对手,获得修为${xiuwei},气血${qixue},剩余血量${
                A_player.当前血量 + Data_battle.A_xue
              },剩余次数${action.cishu - 1}`;
              let random = Math.random(); //万分之一出神迹
              let newrandom = 0.995;
              let dy = await Read_danyao(player_id);
              newrandom -= dy.beiyong1;
              if (dy.ped > 0) {
                dy.ped--;
              } else {
                dy.beiyong1 = 0;
                dy.ped = 0;
              }
              await Write_danyao(player_id, dy);
              if (random > newrandom) {
                let length = data.xianchonkouliang.length;
                let index = Math.trunc(Math.random() * length);
                let kouliang = data.xianchonkouliang[index];
                fyd_msg +=
                  '\n七彩流光的神奇仙谷[' +
                  kouliang.name +
                  ']深埋在土壤中，是仙兽们的最爱。';
                await Add_najie_thing(player_id, kouliang.name, '仙宠口粮', 1);
              }
              let random_pifu= Math.random()
              if(random_pifu>0.999999){
                if(najie_random>0.5){
                  let length_najie=data.kamian.length
                  let index_najie=Math.trunc(Math.random() * length_najie);
                  let Get_najie=data.kamian[index_najie]
                  fyd_msg +=
                  '\n历经九九八十一难，在历练中练就出了一道玄影[' +
                  Get_najie.name +
                  ']';
                  await Add_najie_thing(player_id, Get_najie.name, '道具', 1);
                }else{
                  let length_lianqi=data.kamian3.length
                  let index_lianqi=Math.trunc(Math.random() * length_lianqi);
                  let Get_lianqi=data.kamian3[index_lianqi]
                  fyd_msg +=
                  '\n历经九九八十一难，在历练中练就出了一道玄影[' +
                  Get_lianqi.name +
                  ']';
                  await Add_najie_thing(player_id, Get_lianqi.name, '道具', 1);
                }
              }
              if (random > 0.1 && random < 0.1002) {
                fyd_msg +=
                  '\n' +
                  B_player.名号 +
                  '倒下后,你正准备离开此地，看见路边草丛里有个长相奇怪的石头，顺手放进了纳戒。';
                await Add_najie_thing(player_id, '长相奇怪的小石头', '道具', 1);
              }
            } else if (msgg.find(item => item == B_win)) {
              xiuwei = 800;
              last_msg =
                '不巧撞见[' +
                B_player.名号 +
                '],经过一番战斗,败下阵来,还好跑得快,只获得了修为' +
                xiuwei +
                ',剩余血量' +
                A_player.当前血量;
                loss+=1
            }
            

            //先完结再结算
            await Add_血气(player_id, qixue);
            await Add_修为(player_id, xiuwei);
            await Add_HP(player_id, Data_battle.A_xue);
            action.cishu--
            

            }
            let loss_msg=''
            
            if(loss!=0){
              loss_msg=`探索秘境中遇到不是对手的怪物${loss}次，还好跑得快，只获得了800修为`
            }
            let msg_last_2=[]
            for(let i in msg_last){
              msg_last_2.push(`[${i}]×${msg_last[i]}个。`)
            }
            msg.push(`@${player.名号}在${cishu}次探索秘境中获得了:`)
            msg.push( msg_last_2 + fyd_msg+loss_msg);
            
            e.reply(await get_log_img(msg))
            let arr = action;
              //把状态都关了
              arr.shutup = 1; //闭关状态
              arr.working = 1; //降妖状态
              arr.power_up = 1; //渡劫状态
              arr.Place_action = 1; //秘境
              arr.Place_actionplus = 1; //沉迷状态
              //结束的时间也修改为当前时间
              arr.end_time = new Date().getTime();
              //结算完去除group_id
              delete arr.group_id;
              //写入redis
              await redis.set(
                'xiuxian:player:' + player_id + ':action',
                JSON.stringify(arr)
              );
            e.reply("沉迷秘境结算完成")




            
          }else{
            e.reply("未到时候")
            return
          }
        
        }else{
          e.reply("无状态")
          return
        }
      }else{
        e.reply("无状态")
        return
      }
    }
    async send(e){
      if (e.isGroup) {
        e.reply('此功能暂时不开放在群');
        return false;
      }
      let nowid=e.user_id.toString().replace('qg_','')

      let channel;
      try {
        channel = await Read_channel();
      } catch {
        //没有建立一个
        await Write_channel([]);
        channel = await Read_channel();
      }
      for (let i = 0; i < channel.length; i++) {
        if(channel[i].QQ_ID==nowid || channel[i].频道_ID==nowid){
          e.reply("你已经发送或绑定过频道了，密钥为:"+channel[i].密钥)
          return
        }
      }
      var num=15
      var amm = ["!", "@", "#", "$", "%", "&", "*", "(", ")", "_",1,2,3,4,5,6,7,8,9,"A","B","C","D","E","F","G"];
      var tmp = Math.floor(Math.random() * num);
      var s = tmp;//密钥
      s = s + amm[tmp];
      for (let i = 0; i < Math.floor(num/2)-1; i++) {
        tmp = Math.floor(Math.random() * 26);
        s = s + String.fromCharCode(65 + tmp);
      }
      for (let i = 0; i < (num-Math.floor(num/2)-1); i++) {
        tmp = Math.floor(Math.random() * 26);
        s = s + String.fromCharCode(97 + tmp);
      }
      await fstadd_channel(nowid,0,s)
      e.reply("您的密钥为:"+s+"请在私聊需要绑定端的机器人发送#接受频道绑定"+s)
      

    }
    async reception(e){
      let nowid=e.user_id.toString().replace('qg_','')
      // var i = nowid;
      // var l=0;
      //     while(i >= 1){
      //     i=i/10;
      //     l++;
      //     }
      // if(l<11){//判断是否为频道19位id
      //   e.reply("请在频道机器人端接受绑定申请")
      //   return
      // }
      let key = e.msg.replace('#接受频道绑定', '');
      let channel;
      try {
        channel = await Read_channel();
      } catch {
        //没有建立一个
        await Write_channel([]);
        channel = await Read_channel();
      }
      for (let i = 0; i < channel.length; i++) {
        if(channel[i].密钥==key){
          // if(nowid.indexOf("wx") != -1){
          //   channel[i].微信_ID=nowid.toString()
          //   await Write_channel(channel)
          //   e.reply("与账号"+channel[i].QQ_ID+"绑定成功")
          // }else 
          if(channel[i].QQ_ID==0){//频道发起的
            var p = nowid;
            var l=0;
                while(p >= 1){
                p=p/10;
                l++;
                }
            if(l>10){//判断是否为频道19位id
              e.reply("禁止在发起端接受申请")
              return
            }
            channel[i].QQ_ID=nowid.toString()
            await Write_channel(channel)
            e.reply("与账号"+channel[i].QQ_ID+"绑定成功")
            
          }else if(channel[i].频道_ID==0){//群发起的
            var k = nowid;
            var l=0;
                while(k >= 1){
                k=k/10;
                l++;
                }
            if(l<11){//判断是否为频道19位id
              e.reply("禁止在发起端接受申请")
              return
            }
            channel[i].频道_ID=nowid.toString()
            await Write_channel(channel)
            e.reply("与账号"+channel[i].频道_ID+"绑定成功")
          }
          return
        }
      }
      e.reply("未找到该申请")
    }
    async conversion(e){
      if(!e.isMaster){
        return
      }
      let playerList = [];
      let files = fs
        .readdirSync('./plugins/' + AppName + '/resources/data/xiuxian_player')
        .filter(file => file.endsWith('.json'));
      for (let file of files) {
        file = file.replace('.json', '');
        playerList.push(file);
      }
      let msg=0
      for (let player_id of playerList) {
      let nowid=player_id
      nowid=nowid.toString()

      var i = nowid;
      var l=0;
          while(i >= 1){
          i=i/10;
          l++;
          }
      var channel_id=0
      var channel_id2=0
      let channel;
      try {
        channel = await Read_channel();
      } catch {
        //没有建立一个
        await Write_channel([]);
        channel = await Read_channel();
      }
      let user=''
      for (i = 0; i < channel.length; i++) {
        if(channel[i].QQ_ID==nowid){
          user=channel[i]
          let player=await Read_player(nowid)
          player.id=nowid
          await Write_player(nowid,player)
        }
      }
      if(user==''){continue}
      msg+=1
      continue
      channel_id=user.频道_ID//转群
      channel_id2=user.QQ_ID

      
      let ifexistplay = await existplayer(channel_id2);
      if (ifexistplay){e.reply("发生错误:玩家"+channel_id2+'在两端存在存档，请管理员手动操作')}

        //宗门
        let dir = data.filePathMap.association;
        let File = fs.readdirSync(dir);
        File = File.filter(file => file.endsWith('.json')); //这个数组内容是所有的宗门名称
        for (var i = 0; i < File.length; i++) {
          let this_name = File[i].replace('.json', '');
          let this_ass = await data.getAssociation(this_name);
          for (var z=0;z<this_ass.所有成员.length;z++){
            if(this_ass.所有成员[z]==channel_id){

              this_ass.所有成员[z]=channel_id2

              
              data.setAssociation(this_name, this_ass);
            }
          }
          for (var z=0;z<this_ass.外门弟子.length;z++){
            if(this_ass.外门弟子[z]==channel_id){

              this_ass.外门弟子[z]=channel_id2

              
              data.setAssociation(this_name, this_ass);
            }
          }
          for (var z=0;z<this_ass.内门弟子.length;z++){
            if(this_ass.内门弟子[z]==channel_id){

              this_ass.内门弟子[z]=channel_id2

              
              data.setAssociation(this_name, this_ass);
            }
          }
          for (var z=0;z<this_ass.长老.length;z++){
            if(this_ass.长老[z]==channel_id){

              this_ass.长老[z]=channel_id2

              
              data.setAssociation(this_name, this_ass);
            }
          }
          if(this_ass.宗主==channel_id){

            this_ass.宗主=channel_id2

            
            data.setAssociation(this_name, this_ass);
          }
          
        }
        //冲水堂
        let Exchange;
        try {
          Exchange = await Read_Exchange();
        } catch {
          //没有表要先建立一个！
          await Write_Exchange([]);
          Exchange = await Read_Exchange();
        }
        for (let i of Exchange) {
          let usr_qq = i.qq;
          if(usr_qq==channel_id){
            i.qq=channel_id2
            await Write_Exchange(Exchange)
          }
        }
        //聚宝堂
        let Forum;
        try {
          Forum = await Read_Forum();
        } catch {
          //没有表要先建立一个！
          await Write_Forum([]);
          Forum = await Read_Forum();
        }
        for (let i of Forum) {
          let usr_qq = i.qq;
          if(usr_qq==channel_id){
            i.qq=channel_id2
            await Write_Forum(Forum)
          }
        }
        //亲密度
        let qinmidu;
        try {
          qinmidu = await Read_qinmidu();
        } catch {
          //没有表要先建立一个！
          await Write_qinmidu([]);
          qinmidu = await Read_qinmidu();
        }
        for (let i of qinmidu) {
          let usr_qqA = i.QQ_A;
          let usr_qqB = i.QQ_B;
          if(usr_qqA==channel_id){
            i.QQ_A=channel_id2
            await Write_qinmidu(qinmidu)
          }
          if(usr_qqB==channel_id){
            i.QQ_B=channel_id2
            await Write_qinmidu(qinmidu)
          }
        }
        //天地榜
        let tiandibang;
        try {
          tiandibang = await Read_tiandibang();
        } catch {
          //没有表要先建立一个！
          await Write_tiandibang([]);
          tiandibang = await Read_tiandibang();
        }
        for (let i of tiandibang) {
          let usr_qq = i.qq;
          if(usr_qq==channel_id){
            i.qq=channel_id2
            await Write_tiandibang(tiandibang)
          }
        }
        //炉子
        let duanlu;
        try {
          duanlu = await Read_tripod();
        } catch {
          //没有表要先建立一个！
          await Write_duanlu([]);
          duanlu = await Read_tripod();
        }
        for (let i of duanlu) {
          let usr_qq = i.qq;
          if(usr_qq==channel_id){
            i.qq=channel_id2
            await Write_duanlu(duanlu)
          }
        }

          //   //状态寄，主要问题在获取状态后数据不能赋值
          // //得到redis游戏状态
          let action = await redis.get('xiuxian:player:' + channel_id + ':action');
          action = await JSON.parse(action);
          await redis.set('xiuxian:player:' + channel_id2 + ':action', JSON.stringify(action));
          if (action != null) {
            //把状态都关了
            let arr = action;
            arr.is_jiesuan = 1; //结算状态
            arr.shutup = 1; //闭关状态
            arr.working = 1; //降妖状态
            arr.power_up = 1; //渡劫状态
            arr.Place_action = 1; //秘境
            arr.Place_actionplus = 1; //沉迷状态
            arr.end_time = new Date().getTime(); //结束的时间也修改为当前时间
            delete arr.group_id; //结算完去除group_id
            await redis.set('xiuxian:player:' + channel_id + ':action', JSON.stringify(arr));
          }
          
        //副职
        let action2 = await redis.get('xiuxian:player:' + channel_id + ':fuzhi'); //副职
        action2 = await JSON.parse(action2); 
        if (action2 != null) {
          await redis.set(
            'xiuxian:player:' + channel_id2 + ':fuzhi',
            JSON.stringify(action2)
          );
          action2=null
          await redis.set(
            'xiuxian:player:' + channel_id + ':fuzhi',
            JSON.stringify(action2)
          );
        }

        console.log(typeof channel_id2)
        fs.rename(`./plugins/xiuxian-emulator-plugin/resources/data/xiuxian_player/${channel_id}.json`,`./plugins/xiuxian-emulator-plugin/resources/data/xiuxian_player/${channel_id2}.json`,(err)=>{
          if (err) throw err;
          console.log('Rename complete!1');
        })

        fs.rename(`./plugins/xiuxian-emulator-plugin/resources/data/xiuxian_najie/${channel_id}.json`,`./plugins/xiuxian-emulator-plugin/resources/data/xiuxian_najie/${channel_id2}.json`,(err)=>{
          if (err) throw err;
          console.log('Rename complete!2');
        })

        fs.rename(`./plugins/xiuxian-emulator-plugin/resources/data/xiuxian_equipment/${channel_id}.json`,`./plugins/xiuxian-emulator-plugin/resources/data/xiuxian_equipment/${channel_id2}.json`,(err)=>{
          if (err) throw err;
          console.log('Rename complete!3');
        })

        fs.rename(`./plugins/xiuxian-emulator-plugin/resources/data/xiuxian_danyao/${channel_id}.json`,`./plugins/xiuxian-emulator-plugin/resources/data/xiuxian_danyao/${channel_id2}.json`,(err)=>{
          if (err) throw err;
          console.log('Rename complete!4');
        })
        msg+=1
        
      }
      e.reply(`转换存档${msg}个成功`)
    }
  /**
   * 推送消息，群消息推送群，或者推送私人
   * @param id
   * @param is_group
   * @return  falses {Promise<void>}
   */
  async pushInfo(id, is_group, msg) {
    if (is_group) {
      await Bot.pickGroup(id)
        .sendMsg(msg)
        .catch(err => {
          Bot.logger.mark(err);
        });
    } else {
      await common.relpyPrivate(id, msg);
    }
  }
}
async function Write_tiandibang(wupin) {
  let dir = path.join(__PATH.tiandibang, `tiandibang.json`);
  let new_ARR = JSON.stringify(wupin, '', '\t');
  fs.writeFileSync(dir, new_ARR, 'utf8', err => {
    console.log('写入成功', err);
  });
  return false;
}


async function channel(usr_qq) {
  const dir = path.join(`${__PATH.channel}/channel.json`);
  const logfile = fs.readFileSync(dir, 'utf8');
  const allRecords = JSON.parse(logfile);
   if (usr_qq.length > 16) {
    for (let record of allRecords) {
      if (record.频道_ID == usr_qq) {
        usr_qq = record.QQ_ID; // 使用存档的 usr_qq
        let ifexistplay = data.existData("player", usr_qq);
        if (!ifexistplay) {
          usr_qq = record.频道_ID; // 使用存档的 usr_qq
        }
        break;
      }
    }
  } else {
    for (let record of allRecords) {
      if (record.频道_ID == usr_qq) {
        usr_qq = record.QQ_ID; // 使用存档的 usr_qq
        let ifexistplay = data.existData("player", usr_qq);
        if (!ifexistplay) {
          usr_qq = record.频道_ID; // 使用存档的 usr_qq
        }
        break;
      }
    }
  }
  return usr_qq; // 返回转换后的 usr_qq 值
}

async function Read_tiandibang() {
  let dir = path.join(`${__PATH.tiandibang}/tiandibang.json`);
  let tiandibang = fs.readFileSync(dir, 'utf8', (err, data) => {
    if (err) {
      console.log(err);
      return 'error';
    }
    return data;
  });
  //将字符串数据转变成数组格式
  tiandibang = JSON.parse(tiandibang);
  return tiandibang;
}
