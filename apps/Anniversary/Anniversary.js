import plugin from '../../../../lib/plugins/plugin.js'
import data from '../../model/XiuxianData.js'
import config from "../../model/Config.js"
import fs from "fs"
import { Read_player, existplayer,sleep,exist_najie_thing, Add_血气, getLastsign2 } from '../../model/xiuxian.js'
import {  Write_player,  } from '../../model/xiuxian.js'
import { shijianc,  isNotNull,ForwardMsg } from '../../model/xiuxian.js'
import { Add_灵石,  Add_najie_thing,channel} from '../../model/xiuxian.js'

import { segment } from "oicq"
import { __PATH } from '../../model/xiuxian.js'
import Show from '../../model/show.js';
import puppeteer from '../../../../lib/puppeteer/puppeteer.js';
import { InitWorldBoss } from '../TeamBoss/TeamBoss.js'
/**
 * 全局
 */
let allaction = false;//全局状态判断

/**
 * 新年系统
 */

export class Anniversary extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'GuessLanternRiddles',
            /** 功能描述 */
            dsc: '猜灯谜模块',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 600,
            rule: [
                // {
                //     reg: '^#出题吧$',
                //     fnc: 'Set_question'
                // },
                // {
                //     reg: '^#酿制.*$',
                //     fnc: 'B'
                // },
                // {
                //     reg: '^#赠与巴巴托斯.*$',
                //     fnc: 'A'
                // },
                // {
                //     reg: '^#酿酒配方$',
                //     fnc: 'C'
                // },
                {
                    reg: '^#集齐四符,龙腾虎跃！$',
                    fnc: 'D'
                },
                {
                    reg: '^#周年签到$',
                    fnc: 'daily_gift2'
                },
                {
                    reg: '^#遣(虎|龙)$',
                    fnc: 'sk'
                },
                {
                    reg: '^#十遣(虎|龙)$',
                    fnc: 'skten'
                },
                // {
                //     reg: '^#自选存档皮肤.*$',
                //     fnc: 'cundan_pifu'
                // },

            ]
        })
        this.xiuxianConfigData = config.getConfig("xiuxian", "xiuxian");
    }

        //新年签到
        async daily_gift2(e) {
            //不开放私聊功能
            if (!e.isGroup) {
                return;
            }
            let usr_qq = e.user_id.toString().replace('qg_','');
            usr_qq = await channel(usr_qq);
            //有无账号
            let ifexistplay = await existplayer(usr_qq);
            if (!ifexistplay) {
                return;
            }
            let now = new Date();
            let nowTime = now.getTime(); //获取当前日期的时间戳
            let Yesterday = await shijianc(nowTime - 24 * 60 * 60 * 1000);//获得昨天日期
            let Today = await shijianc(nowTime);
            let lastsign_time = await getLastsign2(usr_qq);//获得上次签到日期
            if (Today.Y == lastsign_time.Y && Today.M == lastsign_time.M && Today.D == lastsign_time.D) {
                e.reply(`今日已经签到过了`);
                return;
            }
            let Sign_Yesterday;        //昨日日是否签到
            if (Yesterday.Y == lastsign_time.Y && Yesterday.M == lastsign_time.M && Yesterday.D == lastsign_time.D) {
                Sign_Yesterday = true;
            }
            else {
                Sign_Yesterday = false;
            }
            await redis.set("xiuxian:player:" + usr_qq + ":lastsign_time2", nowTime);//redis设置签到时间
            let player = await data.getData("player", usr_qq);
            if(!isNotNull(player.新年签到天数)){
                player.周年签到天数=0
            }
            if(player.周年签到天数==999){
                e.reply("您已领取过新年礼包了,不能再领取了")
                return
            }
            if(!Sign_Yesterday){//昨天没有签到,连续签到天数清零
                player.新年签到天数=0
            }
            player.新年签到天数 += 1;
            data.setData("player", usr_qq, player);
            if (player.新年签到天数 == 7) {
                let random=Math.random()
                let thing_name=""
                if(random>0.8){
                    let character=["龙","腾","虎","跃"]
                    let random2=Math.floor(Math.random()*character.length)
                    await Add_najie_thing(usr_qq,character[random2],"道具",1)
                    thing_name=character[random2]
                }
                await Add_灵石(usr_qq,200000)
                await Add_najie_thing(usr_qq, "秘境之匙", "道具", 3)
                await Add_najie_thing(usr_qq,"遣虎令","道具",1)
                player.新年签到天数 = 999;
                e.reply("您已连续签到七天,成功领取周年庆福利礼包("+thing_name+"灵石x20w,秘境之匙x3,遣虎令x1)")
                return
            }

            //给奖励
            let gift_xiuwei = player.新年签到天数 * 3000;
            await Add_najie_thing(usr_qq, "秘境之匙", "道具", this.xiuxianConfigData.Sign.ticket);
            await Add_血气(usr_qq, gift_xiuwei);
            let msg = [
                segment.at(usr_qq),
                `周年签到成功,已经连续签到${player.新年签到天数}天了，获得了${gift_xiuwei}血气,秘境之匙x${this.xiuxianConfigData.Sign.ticket}`
            ]
            await Write_player(usr_qq,player)
            e.reply(msg);
            return;
        }
        // //换肤
        // async cundan_pifu (e){
        //     if (!e.isGroup) {
        //         return;
        //     }
        //     let usr_qq=e.user_id;
        //     var didian = e.msg.replace('#自选存档皮肤', '');
        //     //命令判断
        //     let code = didian.split("\*");
        //     //数量判断
        //     didian = code[0];
        //     let type=code[1]
        //     let x = await exist_najie_thing(usr_qq, "虚无幻影", "道具")
        //     if (!x) {
        //         e.reply("你没有【虚无幻影】")
        //         return
        //     }
        //     if(!isNotNull(type)){
        //         e.reply("未输入类型")
        //     }
        //     didian = didian.trim();
        //     let photo=999;
        //     let File = fs.readdirSync(__PATH.player_pifu_path);
        //     File = File.filter(file => file.endsWith(".jpg"));
        //     let File_length1 = File.length;
        //     for (var k = 0; k < File_length1; k++) {
        //         if (didian==File[k].replace(".jpg", ''))
        //         {
        //             photo=didian;
        //             break;
        //         }
    
        //     }
        //     File = fs.readdirSync(__PATH.equipment_pifu_path);
        //     File = File.filter(file => file.endsWith(".jpg"));
        //     let File_length2 = File.length;
        //     for (var k = 0; k < File_length2; k++) {
        //         if (didian==File[k].replace(".jpg", ''))
        //         {
        //             photo=didian;
        //             break;
        //         }
    
        //     }
        //     if (photo==999)
        //     {
        //         if(type=="练气"){
        //             e.reply("该图片id不存在,范围[0-"+(File_length1)+"]")
        //             return
        //         }
        //         if(type=="装备"){
        //             e.reply("该图片id不存在,范围[0-"+(File_length2)+"]")
        //             return
        //         }
        //         e.reply("你输入的类型不正确,例#自选存档皮肤2*练气(或装备)")
        //         return;
        //     }
        //     else
        //     {
        //         let kamian = data.daoju_list.find(item => item.id == photo);
        //         let player=await Read_player(usr_qq)
        //         player.练气皮肤=kamian.id
        //         await Write_player(usr_qq,player)
        //         await Add_najie_thing(usr_qq,kamian.name,"道具",1)
        //         await Add_najie_thing(usr_qq,"虚无幻影","道具",-1)
        //         e.reply("兑换"+kamian.name+"成功")
        //     }
        //     return;
        // }
        async skten(e) {
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
            let ifexistplay = await existplayer(usr_qq);
            if (!ifexistplay) {
                return;
            }
            let thing = e.msg.replace("#", '');
            thing = thing.replace("十连抽", '');
            if (thing == "虎") {
                let x = await exist_najie_thing(usr_qq, "遣虎令", "道具")
                if (!x) {
                    e.reply("你没有【遣虎令】")
                    return
                }
                if (x < 10) {
                    e.reply("你没有足够的【遣虎令】")
                    return
                }
                e.reply("十道金光从天而降")
                let msg = []
                let all = []
                await sleep(5000)
                for (var i = 0; 10 > i; i++) {
                    let tianluoRandom = Math.floor(Math.random() * (data.changzhu.length));

                    msg.push("一道金光掉落在地上，走近一看是【" +data.changzhu[tianluoRandom].name+"】")
                    await Add_najie_thing(usr_qq, data.changzhu[tianluoRandom].name,data.changzhu[tianluoRandom].class, data.changzhu[tianluoRandom].数量)
                    all.push("【" + data.changzhu[tianluoRandom].name + "x+"+data.changzhu[tianluoRandom].数量+"个】")
                }
                await Add_najie_thing(usr_qq, "遣虎令", "道具", -10)
                await ForwardMsg(e, msg)
                e.reply("恭喜获得\n" + all)
            }
            if (thing == "龙") {
                let x = await exist_najie_thing(usr_qq, "遣龙令", "道具")
                if (!x) {
                    e.reply("你没有【遣龙令】")
                    return
                }
                if (x < 10) {
                    e.reply("你没有足够的【遣龙令】")
                    return
                }
                e.reply("十道金光从天而降")
                let msg = []
                let all = []
                await sleep(5000)
                for (var i = 0; 10 > i; i++) {
                    let tianluoRandom = Math.floor(Math.random() * (data.xianding.length));

                    msg.push("一道金光掉落在地上，走近一看是【" +data.xianding[tianluoRandom].name+"】")
                    await Add_najie_thing(usr_qq, data.xianding[tianluoRandom].name,data.xianding[tianluoRandom].class, data.xianding[tianluoRandom].数量)
                    all.push("【" + data.xianding[tianluoRandom].name + "x+"+data.xianding[tianluoRandom].数量+"个】")
                }
                await Add_najie_thing(usr_qq, "遣龙令", "道具", -10)
                await ForwardMsg(e, msg)
                e.reply("恭喜获得\n" + all)
            }
        }
    
        async sk(e) {
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
            let ifexistplay = await existplayer(usr_qq);
            if (!ifexistplay) {
                return;
            }
            let thing = e.msg.replace("#", '');
            thing = thing.replace("遣", '');
            if (thing == "虎") {
                let x = await exist_najie_thing(usr_qq, "遣虎令", "道具")
                if (!x) {
                    e.reply("你没有【遣虎令】")
                    return
                }
                e.reply("一道金光从天而降")
                let tianluoRandom = Math.floor(Math.random() * (data.changzhu.length));
                await Add_najie_thing(usr_qq, data.changzhu[tianluoRandom].name,data.changzhu[tianluoRandom].class, data.changzhu[tianluoRandom].数量)
                await Add_najie_thing(usr_qq, "遣虎令", "道具", -1)
                await sleep(5000)
                e.reply("一道金光掉落在地上，走近一看是【" +data.changzhu[tianluoRandom].name+ "x+"+data.changzhu[tianluoRandom].数量+"个】")
            }
            if (thing == "龙") {
                let x = await exist_najie_thing(usr_qq, "遣龙令", "道具")
                if (!x) {
                    e.reply("你没有【遣龙令】")
                    return
                }
                e.reply("一道金光从天而降")
                let tianluoRandom = Math.floor(Math.random() * (data.xianding.length));
                await Add_najie_thing(usr_qq, data.xianding[tianluoRandom].name,data.xianding[tianluoRandom].class, data.xianding[tianluoRandom].数量)
                await Add_najie_thing(usr_qq, "遣龙令", "道具", -1)
                await sleep(5000)
                e.reply("一道金光掉落在地上，走近一看是【" +data.xianding[tianluoRandom].name+ "x+"+data.xianding[tianluoRandom].数量+"个】")
            }
        }
    // async Set_question(e){

    //     let usr_qq = e.user_id;
    //     //有无存档
    //     let ifexistplay = await existplayer(usr_qq);
    //     if (!ifexistplay) {
    //         return;
    //     }
    //     await Go(e);
    //     if (allaction) {
    //         console.log(allaction);
    //     }
    //     else {
    //         return;
    //     }
    //     allaction = false;
    //     let player=await Read_player(usr_qq)

    //     if(!isNotNull(player.灯谜)){
    //         player.灯谜=0
    //         await Write_player(usr_qq,player)
    //     }
    //     if(player.灯谜>=5){
    //         e.reply("灯谜要被猜完了啦，不能再猜了")
    //         return
    //     }
    //     let random=Math.trunc(Math.random()*data.Lantern_riddles.length)
    //     e.reply("听好啦！本堂主要出题了！")
    //     await sleep(3000)
    //     e.reply("题目是:"+data.Lantern_riddles[random].灯谜)
    //     await redis.set("xiuxian:player:" + usr_qq + ":GuessLanternRiddles", random)
    //     /** 设置上下文 */
    //     this.setContext('answer');
    //     /** 回复 */
    //     await e.reply('请在120秒内作答哦,超时则啥都没有哦(可以私聊给我答案哦)', false, { at: true });
    //     return;
    // }
    // async answer(e){
    //     let MITI = await redis.get("xiuxian:player:" + e.user_id + ":GuessLanternRiddles");
    //     if (this.e.msg == data.Lantern_riddles[MITI].谜底) {
    //         let character=["银","银","银","银","银","银","花","花","花","花","花","造","造","造","造","造","造","造","福","盈","盈","盈","盈","盈","盈"]
    //         let random=Math.trunc(Math.random()*character.length)
    //         await Add_najie_thing(e.user_id,character[random],"道具",1)
    //         e.reply(`哎呀呀,居然猜对了,这张[${character[random]}]字符就赠与你啦`);
    //     }
    //     else {
    //         e.reply(`很可惜呢,没有猜对呢,本堂主就送你一株霓裳花作为安慰奖吧`);
    //         await Add_najie_thing(e.user_id,"霓裳花","道具",1)
    //     }
    //     let player=await Read_player(e.user_id)
    //     player.灯谜+=1
    //     await Write_player(e.user_id,player)
    //     /** 结束上下文 */
    //     this.finish('answer');
    // }




    // async A(e){
    //     //不开放私聊功能
    //     if (!e.isGroup) {
    //         return;
    //     }
    //     let usr_qq = e.user_id;
    //     //有无存档
    //     let ifexistplay = await existplayer(usr_qq);
    //     if (!ifexistplay) {
    //         return;
    //     }
    //     await Go(e);
    //     if (allaction) {
    //         console.log(allaction);
    //     }
    //     else {
    //         return;
    //     }
    //     allaction = false;

    //     //命令判断
    //     let thing = e.msg.replace("#", '');
    //     thing = thing.replace("赠与巴巴托斯", '');
    //     let code = thing.split("\*");
    //     //数量判断
    //     let thing_name = code[0];
    //     let quantity = 0;//指令里写的数量
    //     if (parseInt(code[1]) != parseInt(code[1])) {
    //         quantity = 1;
    //     } else if (parseInt(code[1]) < 1) {
    //         e.reply(`输入物品数量小于1,现在默认为1`);
    //         quantity = 1;
    //     } else {
    //         quantity = parseInt(code[1]);
    //     }
    //     //纳戒中的数量
    //     let thing_quantity = await exist_najie_thing(usr_qq, thing_name, "道具");
    //     if (!thing_quantity) {//没有
    //         e.reply(`你没有【${thing_name}】这样的佳酿`);
    //         return;
    //     }
    //     if (thing_quantity < quantity) {//不够
    //         e.reply(`你目前只有【${thing_name}】*${thing_quantity},数量不够`);
    //         return;
    //     }
    //     let number=data.daoju_list.find(item => item.name == thing_name).number*quantity
    //     await Add_najie_thing(usr_qq,"遣虎令","道具",number)
    //     e.reply("巴巴托斯:居然送我这么好的酒哇,我也无以为报,这样吧,我把我在天空岛捡到的石头送给你好了(获得遣龙令"+number+"个)")
    // }

    // async B(e){
    //     //不开放私聊功能
    //     if (!e.isGroup) {
    //         return;
    //     }
    //     let usr_qq = e.user_id;
    //     //有无存档
    //     let ifexistplay = await existplayer(usr_qq);
    //     if (!ifexistplay) {
    //         return;
    //     }
    //     await Go(e);
    //     if (allaction) {
    //         console.log(allaction);
    //     }
    //     else {
    //         return;
    //     }
    //     allaction = false;
    //     //命令判断
    //     let thing = e.msg.replace("#", '');
    //     thing = thing.replace("酿制", '');
    //     let code = thing.split("\*");
    //     //数量判断
    //     let thing_name = code[0];
    //     let quantity = 0;//指令里写的数量
    //     if (parseInt(code[1]) != parseInt(code[1])) {
    //         quantity = 1;
    //     } else if (parseInt(code[1]) < 1) {
    //         e.reply(`输入物品数量小于1,现在默认为1`);
    //         quantity = 1;
    //     } else {
    //         quantity = parseInt(code[1]);
    //     }
    //     //调取配方
    //     let peifang=data.Niangjiu.find(item => item.name == thing_name)
    //     if(!peifang){
    //         e.reply("不存在["+thing_name+"]的配方")
    //     }
    //     for(var i=0;i<peifang.配方.length;i++){
    //         let thing_quantity = await exist_najie_thing(usr_qq, peifang.配方[i].name, "道具");
    //         if (!thing_quantity) {//没有
    //             e.reply(`你没有【${thing_name}】这样的材料`);
    //             return;
    //         }
    //         if (thing_quantity < quantity) {//不够
    //             e.reply(`你目前只有【${peifang.配方[i].name}】*${thing_quantity},数量不够`);
    //             return;
    //         }
    //     }
    //     let random=Math.random()
    //     let jishu=0
    //     for(var z=0;z<quantity;z++){
    //         if(random>peifang.成功率){
    //             quantity-=1
    //             jishu+=1
    //         }
    //     }
    //     await Add_najie_thing(usr_qq,thing_name,"道具",quantity)
    //     e.reply("经过阵法师的时间加速能力,材料很快便成了佳酿,酿成功了"+quantity+"次,失败了"+jishu+"次")
    // }


    // async C(e) {
    //     if (!e.isGroup) {
    //         return;
    //     }
    //     let img = await get_Niangjiu_img(e);
    //     e.reply(img);
    //     return;
    // }

    async D(e){
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id.toString().replace('qg_','');
        usr_qq = await channel(usr_qq);
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        await Go(e);
        if (allaction) {
            console.log(allaction);
        }
        else {
            return;
        }
        allaction = false;
        let peifang=["龙","腾","虎","跃"]
        for(var i=0;i<peifang.length;i++){
            let thing_quantity = await exist_najie_thing(usr_qq, peifang[i], "道具");
            if (!thing_quantity) {//没有
                e.reply(`你没有【${peifang[i]}】字符,召唤失败`);
                return;
            }
            await Add_najie_thing(usr_qq,peifang[i],"道具",-1)
        }

        //刷新若陀
        await InitWorldBoss(e.user_id,e)
        e.reply("千年的封印再次被破开,天地剧烈抖动,岩之神明所创之物:[若陀龙王]再现人世");

    }



}
/**
 * 状态
 */
 export async function Go(e) {
    let usr_qq = e.user_id;
    //有无存档
    let ifexistplay = await existplayer(usr_qq);
    if (!ifexistplay) {
        return;
    }
    //获取游戏状态
    let game_action = await redis.get("xiuxian:player:" + usr_qq + ":game_action");
    //防止继续其他娱乐行为
    if (game_action == 0) {
        e.reply("修仙：游戏进行中...");
        return;
    }
    //查询redis中的人物动作
    let action = await redis.get("xiuxian:player:" + usr_qq + ":action");
    action = JSON.parse(action);
    if (action != null) {
        //人物有动作查询动作结束时间
        let action_end_time = action.end_time;
        let now_time = new Date().getTime();
        if (now_time <= action_end_time) {
            let m = parseInt((action_end_time - now_time) / 1000 / 60);
            let s = parseInt(((action_end_time - now_time) - m * 60 * 1000) / 1000);
            e.reply("正在" + action.action + "中,剩余时间:" + m + "分" + s + "秒");
            return;
        }
    }
    allaction = true;
    return;
}


// export async function get_Niangjiu_img(e) {
//     let usr_qq = e.user_id;
//     let ifexistplay = data.existData("player", usr_qq);
//     if (!ifexistplay) {
//         return;
//     }


//     let danfang_list = data.Niangjiu;

//     let danfang_data = {
//         user_id: usr_qq,
//         danfang_list: danfang_list
//     }
//     const data1 = await new Show(e).get_NIANGJIU(danfang_data);
//     let img = await puppeteer.screenshot("Niangjiu", {
//         ...data1,
//     });
//     return img;
// }

// //初始化伐难
// async function InitWorldBoss() {
//     let AverageDamageStruct = await GetAverageDamage();
//     let player_quantity = parseInt(AverageDamageStruct.player_quantity);
//     let AverageDamage = parseInt(AverageDamageStruct.AverageDamage);
//     let fairyNums = parseInt(AverageDamageStruct.fairy_nums);
//     WorldBOSSBattleLock = 0;
//     let X = AverageDamage * 0.01;
//     Bot.logger.mark(`[伐难] 化神玩家总数：${player_quantity}`);
//     Bot.logger.mark(`[伐难] 生成基数:${X}`);
//     let Health =  Math.trunc(X * 280 * player_quantity*2);
//     let Attack = Math.trunc(X*200);
//     let Defence = Math.trunc(X*190);
//     let yuansu=["仙之心·火","仙之心·水","仙之心·雷","仙之心·冰","仙之心·木"];
//     let index = Math.trunc(Math.random() * yuansu.length);
//     let linggen = yuansu[index];
//     let WorldBossStatus = {
//         "名号":"伐难",
//         "当前血量": Health,
//         "血量上限": Health,
//         "isAngry": 0,
//         "isWeak": 0,
//         "攻击": Attack,
//         "防御": Defence,
//         "灵根": {
//             "name": linggen,
//         },
//         "KilledTime": -1,
//     };
//     let PlayerRecord = 0;
//     await redis.set("Xiuxian:WorldBossStatus3", JSON.stringify(WorldBossStatus));
//     await redis.set("Xiuxian:PlayerRecord3", JSON.stringify(PlayerRecord));
//     return 0;
// }
// //获取玩家平均实力和化神以上人数
// async function GetAverageDamage() {
//     let File = fs.readdirSync(data.filePathMap.player);
//     File = File.filter(file => file.endsWith(".json"));
//     let temp = [];
//     let fairyNums = 0;
//     let TotalPlayer = 0;
//     for (var i = 0; i < File.length; i++) {
//         let this_qq = File[i].replace(".json", '');
//         this_qq = parseInt(this_qq);
//         let player = await data.getData("player", this_qq);
//         let level_id = data.Level_list.find(item => item.level_id == player.level_id).level_id;
//         if (level_id >0) {
//             temp[TotalPlayer] = parseInt(player.攻击);
//             Bot.logger.mark(`[伐难] ${this_qq}玩家攻击:${temp[TotalPlayer]}`);
//             TotalPlayer++;
//         }
//     }
//     //排序
//     temp.sort(function (a, b) { return b - a });
//     let AverageDamage = 0;
//     if (TotalPlayer > 15) for (let i = 2; i < temp.length - 4; i++)
//         AverageDamage += temp[i];
//     else for (let i = 0; i < temp.length; i++)
//         AverageDamage += temp[i];
//     AverageDamage = TotalPlayer > 15 ? AverageDamage / (temp.length - 6) : (temp.length == 0 ? 0 : (AverageDamage / temp.length));
//     let res = {
//         "AverageDamage": AverageDamage,
//         "player_quantity": TotalPlayer,
//         "fairy_nums": fairyNums
//     }
//     return res;
// }