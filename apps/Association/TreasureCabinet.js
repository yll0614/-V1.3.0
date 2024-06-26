import { plugin, verc, data } from '../../api/api.js';
import {
  Read_danyao,
  Write_danyao,
  Add_najie_thing,
  isNotNull,
  __PATH,
  shijianc,
  channel
} from '../../model/xiuxian.js';
export class TreasureCabinet extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: 'TreasureCabinet',
      /** 功能描述 */
      dsc: '宗门藏宝阁模块',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 9999,
      rule: [
        {
          reg: '^#我的贡献$',
          fnc: 'gonxian',
        },
        {
          reg: '^#召唤神兽$',
          fnc: 'Summon_Divine_Beast',
        },
        {
          reg: '^#神兽赐福$',
          fnc: 'Beast_Bonus',
        },
      ],
    });
  }
  //我的贡献
  async gonxian(e) {
    if (!verc({ e })) return false;
    let usr_qq = e.user_id.toString().replace('qg_','');
    usr_qq = await channel(usr_qq);
    //用户不存在
    let ifexistplay = data.existData('player', usr_qq);
    if (!ifexistplay) return false;
    let player = data.getData('player', usr_qq);
    //无宗门
    if (!isNotNull(player.宗门)) {
      e.reply('你尚未加入宗门');
      return false;
    }
    if (!isNotNull(player.宗门.lingshi_donate)) {
      player.宗门.lingshi_donate = 0;
    }
    if (0 > player.宗门.lingshi_donate) {
      player.宗门.lingshi_donate = 0;
    }
    //贡献值为捐献灵石除10000
    var gonxianzhi = Math.trunc(player.宗门.lingshi_donate / 10000);
    e.reply(
      '你为宗门的贡献值为[' +
        gonxianzhi +
        '],可以在#宗门藏宝阁 使用贡献值兑换宗门物品,感谢您对宗门做出的贡献'
    );
  }

  async Summon_Divine_Beast(e) {
    //8级宗门，有驻地，灵石200w

    if (!verc({ e })) return false;
    let usr_qq = e.user_id.toString().replace('qg_','');
    usr_qq = await channel(usr_qq);
    //用户不存在
    let ifexistplay = data.existData('player', usr_qq);
    if (!ifexistplay) return false;
    let player = data.getData('player', usr_qq);
    //无宗门
    if (!isNotNull(player.宗门)) {
      e.reply('你尚未加入宗门');
      return false;
    }
    //职位不符
    if (player.宗门.职位 == '宗主') {
    } else {
      e.reply('只有宗主可以操作');
      return false;
    }

    let ass = data.getAssociation(player.宗门.宗门名称);
    if (ass.宗门等级 < 8) {
      e.reply(`宗门等级不足，尚不具备召唤神兽的资格`);
      return false;
    }
    if (ass.宗门建设等级 < 50) {
      e.reply(`宗门建设等级不足,木头墙木头地板的不怕神兽把宗门拆了？`);
      return false;
    }
    if (ass.宗门驻地 == 0) {
      e.reply(`驻地都没有，让神兽跟你流浪啊？`);
      return false;
    }
    if (ass.灵石池 < 2000000) {
      e.reply(`宗门就这点钱，还想神兽跟着你干活？`);
      return false;
    }
    if (ass.宗门神兽 != 0) {
      e.reply(`你的宗门已经有神兽了`);
      return false;
    }
    //校验都通过了，可以召唤神兽了
    let random = Math.random();
    if (random > 0.8) {
      //给丹药,隐藏神兽,赐福时气血和修为都加,宗门驻地等级提高一级
      ass.宗门神兽 = '麒麟';
    } else if (random > 0.6) {
      //给功法，赐福加修为
      ass.宗门神兽 = '青龙';
    } else if (random > 0.4) {
      //给护具，赐福加气血
      ass.宗门神兽 = '玄武';
    } else if (random > 0.2) {
      //给法宝，赐福加修为
      ass.宗门神兽 = '朱雀';
    } else {
      //给武器 赐福加气血
      ass.宗门神兽 = '白虎';
    }

    ass.灵石池 -= 2000000;
    await data.setAssociation(ass.宗门名称, ass);
    e.reply(
      `召唤成功，神兽${ass.宗门神兽}投下一道分身，开始守护你的宗门，绑定神兽后不可更换哦`
    );
    return false;
  }

  async Beast_Bonus(e) {
    if (!verc({ e })) return false;
    let usr_qq = e.user_id.toString().replace('qg_','');
    usr_qq = await channel(usr_qq);
    //用户不存在
    let ifexistplay = data.existData('player', usr_qq);
    if (!ifexistplay) return false;
    let player = data.getData('player', usr_qq);
    //无宗门
    if (!isNotNull(player.宗门)) {
      e.reply('你尚未加入宗门');
      return false;
    }
    let ass = data.getAssociation(player.宗门.宗门名称);
    if (ass.宗门神兽 == 0) {
      e.reply('你的宗门还没有神兽的护佑，快去召唤神兽吧');
      return false;
    }

    let now = new Date();
    let nowTime = now.getTime(); //获取当前日期的时间戳
    let Today = await shijianc(nowTime);
    let lastsign_time = await getLastsign_Bonus(usr_qq); //获得上次宗门签到日期
    if (
      Today.Y == lastsign_time.Y &&
      Today.M == lastsign_time.M &&
      Today.D == lastsign_time.D
    ) {
      e.reply(`今日已经接受过神兽赐福了，明天再来吧`);
      return false;
    }

    await redis.set('xiuxian:player:' + usr_qq + ':getLastsign_Bonus', nowTime); //redis设置签到时间

    let random = Math.random();
    let flag = 0.5;
    //根据好感度获取概率
    let dy = await Read_danyao(usr_qq);
    if (dy.beiyong2 > 0) {
      dy.beiyong2--;
    }
    random += dy.beiyong3;
    if (dy.beiyong2 == 0) {
      dy.beiyong3 = 0;
    }
    await Write_danyao(usr_qq, dy);
    if (random > 0.7) {
      let location;
      let item_name;
      let item_class;
      //获得奖励
      let randomB = Math.random();
      if (ass.宗门神兽 == '麒麟') {
        if (randomB > 0.9) {
          location = Math.floor(Math.random() * data.qilin.length);
          item_name = data.qilin[location].name;
          item_class = data.qilin[location].class;
        } else {
          location = Math.floor(Math.random() * data.danyao_list.length);
          item_name = data.danyao_list[location].name;
          item_class = data.danyao_list[location].class;
        }
        await Add_najie_thing(usr_qq, item_name, item_class, 1);
      } else if (ass.宗门神兽 == '青龙') {
        //给功法，赐福加修为
        if (randomB > 0.9) {
          location = Math.floor(Math.random() * data.qinlong.length);
          item_name = data.qinlong[location].name;
          item_class = data.qinlong[location].class;
        } else {
          location = Math.floor(Math.random() * data.gongfa_list.length);
          item_name = data.gongfa_list[location].name;
          item_class = data.gongfa_list[location].class;
        }
        await Add_najie_thing(usr_qq, item_name, item_class, 1);
      } else if (ass.宗门神兽 == '玄武') {
        //给护具，赐福加气血
        if (randomB > 0.9) {
          location = Math.floor(Math.random() * data.xuanwu.length);
          item_name = data.xuanwu[location].name;
          item_class = data.xuanwu[location].class;
        } else {
          location = Math.floor(Math.random() * data.equipment_list.length);
          item_name = data.equipment_list[location].name;
          item_class = data.equipment_list[location].class;
        }
        await Add_najie_thing(usr_qq, item_name, item_class, 1);
      } else if (ass.宗门神兽 == '朱雀') {
        //给法宝，赐福加修
        if (randomB > 0.9) {
          location = Math.floor(Math.random() * data.xuanwu.length);
          item_name = data.xuanwu[location].name;
          item_class = data.xuanwu[location].class;
        } else {
          location = Math.floor(Math.random() * data.equipment_list.length);
          item_name = data.equipment_list[location].name;
          item_class = data.equipment_list[location].class;
        }
        await Add_najie_thing(usr_qq, item_name, item_class, 1);
      } else {
        //白虎给武器 赐福加气血
        if (randomB > 0.9) {
          location = Math.floor(Math.random() * data.xuanwu.length);
          item_name = data.xuanwu[location].name;
          item_class = data.xuanwu[location].class;
        } else {
          location = Math.floor(Math.random() * data.equipment_list.length);
          item_name = data.equipment_list[location].name;
          item_class = data.equipment_list[location].class;
        }
        await Add_najie_thing(usr_qq, item_name, item_class, 1);
      }
      if (randomB > 0.9) {
        e.reply(`看见你来了,${ass.宗门神兽}很高兴，仔细挑选了${item_name}给你`);
      } else {
        e.reply(`${ass.宗门神兽}今天心情不错，随手丢给了你${item_name}`);
      }
      return false;
    } else {
      e.reply(`${ass.宗门神兽}闭上了眼睛，表示今天不想理你`);
      return false;
    }
  }
}

async function getLastsign_Bonus(usr_qq) {
  //查询redis中的人物动作
  let time = await redis.get('xiuxian:player:' + usr_qq + ':getLastsign_Bonus');
  if (time != null) {
    let data = await shijianc(parseInt(time));
    return data;
  }
  return false;
}
