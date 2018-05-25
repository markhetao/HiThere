"use strict";

//售卖的图片上传记录
var ImgItem = function(text){
    if (text) {
      var item = JSON.parse(text);

      this.id = item.id;//ID
      this.vague = item.vague;//模糊的
      this.clear = item.clear; //清晰的
      this.money = new BigNumber(item.money); //总额
      this.author = item.author; //作者
      this.describe = item.describe; //描述
      this.status = 0; //0模糊 1清晰
      this.timestamp = item.timestamp;//记录的时间
    }else{
      this.id = "";//ID
      this.vague = "";//模糊的
      this.clear = ""; //清晰的
      this.money = new BigNumber(0); //总额
      this.author = ""; //作者
      this.describe = ""; //描述
      this.status = 0; //0模糊 1清晰
      this.timestamp = "";//记录的时间
    }
};

ImgItem.prototype = {
    toString:function(){
      return JSON.stringify(this);
    }
};
//图片售卖记录
var BuyItem = function(text){
    if (text) {
      var item = JSON.parse(text);

      this.id = item.id;//ID
      this.imgID = item.imgID;//图片ID
      this.money = new BigNumber(item.money); //购买总额
      this.buyer = item.buyer; //购买者
      this.timestamp = item.timestamp;//记录的时间
    }else{
      this.id = "";//ID
      this.imgID = "";//图片ID
      this.money = new BigNumber(0); //购买总额
      this.buyer = ""; //购买者
      this.timestamp = Date.parse(new Date());//记录的时间(时间戳)
    }
};

BuyItem.prototype = {
    toString:function(){
      return JSON.stringify(this);
    }
};



var HiThere = function(){
    LocalContractStorage.defineProperty(this,"imgIndex"); //图片自增ID
    LocalContractStorage.defineProperty(this,"buyIndex"); //售卖记录自增ID
    LocalContractStorage.defineProperty(this,"pageNum");//单页数据条数
    //图片上传记录
    LocalContractStorage.defineMapProperty(this,"ImgRepo",{
        parse:function(text){
          return new ImgItem(text);
        },
        stringify:function (o){
          return o.toString();
        }
    });
    //售卖记录
    LocalContractStorage.defineMapProperty(this,"BuyRepo",{
        parse:function(text){
          return new BuyItem(text);
        },
        stringify:function (o){
          return o.toString();
        }
    });
    LocalContractStorage.defineMapProperty(this,"userImgRepo");  //单个用户上传的所有图片ID
    LocalContractStorage.defineMapProperty(this,"userBuyImgRepo");  //单个用户购买的所有图片ID
    LocalContractStorage.defineMapProperty(this,"userBuyRecordRepo");  //单个用户的所有购买记录ID
    LocalContractStorage.defineMapProperty(this,"ImgSellRepo");  //单个图片ID卖的所有记录
};

HiThere.prototype = {
    init: function(){
        this.imgIndex = 0; //记录总条数
        this.buyIndex = 0; //售卖总条数
        this.pageNum =  20; //每页50条数据
    },
     /***********************
        1. 上传图片记录
     ***********************/
    //新增记录
    save: function (vague,clear,money,describe){
        vague = vague.trim();
        if( !vague || vague === ""){
            throw new Error("请上传模糊图片");
        }
        clear = clear.trim();
        if( !clear || clear === ""){
            throw new Error("请上传清晰图片");
        }
        money = new BigNumber(money);
        if( money <=0 ){
            throw new Error("请填写价格");
        }
        describe = describe.trim();
        if( !describe || describe === ""){
            throw new Error("请输入图片描述");
        }

        var author = Blockchain.transaction.from;
        var id = this.imgIndex+1;  //ID号从1开始
        var imgItem = new ImgItem();
        imgItem.id = id;//ID
        imgItem.vague = vague;//模糊的
        imgItem.clear = clear; //清晰的
        imgItem.money = new BigNumber(money)* 1000000000000000000; //总额 单位wei
        imgItem.author = author; //作者
        imgItem.describe = describe; //描述


        //将该记录存入ImgRepo表；
        this.ImgRepo.put(id,imgItem);  
        
        //将该图片ID存入userBuyImgRepo表；
        var userImgIds = this.userImgRepo.get(author)||[]; 
        userImgIds[userImgIds.length] = id;
        this.userImgRepo.set(author,userImgIds);

        this.imgIndex ++;

     },
     /***********************
        2. 付费查看记录
     ***********************/
     //购买图片查看权
     buy:function(imgID){
        imgID = parseInt(imgID);
        if (imgID > this.imgIndex || imgID <= 0) {
            throw new Error("图片编号错误");
        }
        //获取该图片上传ID
        var imgRecord = this.ImgRepo.get(imgID);

        var value = new BigNumber(Blockchain.transaction.value);
        var money = new BigNumber(imgRecord.money) ;

        if (!value.equals(money)){
            throw new Error("支付金额不正确");
        }

        //购买者
        var buyer = Blockchain.transaction.from;


        //再次检测是否已购买过
        //作者的购买过的id
        var buyArrs = this.userBuyImgRepo.get(buyer)||[];
        //已经购买过
        if (buyArrs.indexOf(imgRecord.id) !== -1) {
            throw new Error("您曾付费过该图片，不需再支付费用，请刷新页面");
        }

        /******************************
               将金额转给图片拥有者
        ******************************/
        var author = imgRecord.author;
        Blockchain.transfer(author,value);
        

        //购买成功
        var id = this.buyIndex;
        
        var buyItem = new BuyItem();
        buyItem.id = id;//ID
        buyItem.imgID = imgID;//图片ID
        buyItem.money = new BigNumber(value); //购买总额
        buyItem.buyer = buyer; //购买者

        //存储
        //将该记录存入BuyRepo表；
        this.BuyRepo.put(id,buyItem);  
        

        //将该图片ID存入userBuyImgRepo表；
        var userBuyImgIds = this.userBuyImgRepo.get(buyer)||[]; 
        userBuyImgIds[userBuyImgIds.length] = imgID;
        this.userBuyImgRepo.set(buyer,userBuyImgIds);

        //将该购买记录的ID存入userBuyRecordRepo表；
        var userBuyRecordIds = this.userBuyRecordRepo.get(buyer)||[]; 
        userBuyRecordIds[userBuyRecordIds.length] = id;
        this.userBuyRecordRepo.set(buyer,userBuyRecordIds);

        //将该购买记录的ID存入ImgSellRepo表；
        var imgSellIds = this.ImgSellRepo.get(imgID)||[]; 
        imgSellIds[imgSellIds.length] = id;
        this.ImgSellRepo.set(imgID,imgSellIds);

        this.buyIndex ++;
     },
     /*************************
        3. 获取所有图片信息
     **************************/
     //分页获取图片数据
     getImgs:function(author,p){
        //钱包地址校验
        author = author.trim();
        if( !author || author === ""){
            throw new Error("请输入用户钱包地址");
        }

        //获取分页数据
        var page = parseInt(p);
        page = (page === 0 || !page) ? 1 : page;
        var maxPage = this.getImgTotalPage();//最大页数
        
        var result = [];
        if (maxPage === 0 ) {
            return result;
        }
        //超出页码则循环回到第一页
        page = (page > maxPage)? (page % maxPage) :page;
        page = (page === 0 || !page) ? 1 : page;

        //返回指定页记录
        var star  = (page -1) * this.pageNum; 
        var end   = (this.imgIndex  > page * this.pageNum)? page * this.pageNum : this.imgIndex;
        var num =   end - star;//num为计算该页有多少条记录

        //作者的购买过的id
        var buyArrs = this.userBuyImgRepo.get(author)||[];
        for (var i = num; i >0; i--) {
            var record = this.ImgRepo.get(star+i);

            var newRecord = new ImgItem();
            newRecord.id = record.id;//ID
            newRecord.vague = (buyArrs.indexOf(record.id) == -1)? record.vague:record.clear;//没买过显示模糊的，购买过显示清晰的
            newRecord.clear = ""; //清晰的
            newRecord.money = record.money; //总额
            newRecord.author = record.author; //作者
            newRecord.describe = record.describe; //描述
            newRecord.status = (buyArrs.indexOf(record.id)==-1)? 0 :1; //0模糊 1清晰

            result.push(newRecord);
        }
        return result;
     },

     //获取总图片页码
     getImgTotalPage:function(){
        var maxPage =parseInt(this.imgIndex / this.pageNum);
        maxPage  = (this.imgIndex % this.pageNum === 0 ) ? maxPage: maxPage +1;
        return maxPage;
     },

     //获取图片总个数
     getRecordNum:function(){
        return parseInt(this.imgIndex);
     },

     //获取买卖总次数
     getAuthorNum:function(){
        return parseInt(this.buyIndex);
     },

     /*************************
        4. 某图片的买卖记录
     **************************/
     //获取某图片的所有购买记录
     getImgBuyALLRecord:function(imgID){
        imgID = parseInt(imgID);
        if (imgID > this.imgIndex || imgID <= 0) {
            throw new Error("图片编号错误");
        }
        //所有交易记录的ID
        var imgRecordIDs = this.ImgSellRepo.get(imgID)||[];
        var result = [];
        for (var i = imgRecordIDs.length - 1; i >= 0; i--) {
            var record = this.BuyRepo.get(imgRecordIDs[i]);
            result.push(record);
        }
        return result;
     },

     //获取该图片的总购买条数
     getImgBuyNumber:function(imgID){
        imgID = parseInt(imgID);
        if (imgID > this.imgIndex || imgID <= 0) {
            throw new Error("图片编号错误");
        }
        var result =  this.getImgBuyRecordID ||[];
        return result.length;
     },

     //获取该图片的所有交易记录ID
     getImgBuyRecordID:function(imgID){
        imgID = parseInt(imgID);
        if (imgID > this.imgIndex || imgID <= 0) {
            throw new Error("图片编号错误");
        }
        //所有ID记录
        var imgIDs = this.ImgSellRepo.get(imgID)||[];
        return imgIDs;
     },

     /***********************
        5.某用户交易记录
     ***********************/

     //获取某用户的所有购买记录
     getUserBuyAllRecord:function(author){
        //钱包地址校验
        author = author.trim();
        if( !author || author === ""){
            throw new Error("请输入用户钱包地址");
        }
        //所有交易记录的ID
        var userBuyRecordIDs = this.userBuyRecordRepo.get(author)||[];
        var result = [];
        for (var i = userBuyRecordIDs.length - 1; i >= 0; i--) {
            var record = this.BuyRepo.get(userBuyRecordIDs[i]);
            result.push(record);
        }
        return result;
     },
      //获取该用户的购买记录总条数
     getUserBuyNumber:function(author){
        //钱包地址校验
        author = author.trim();
        if( !author || author === ""){
            throw new Error("请输入用户钱包地址");
        }
        var result = this.getUserBuyRecordID||[];
        return  result.length;
     },
     //获取该用户所有购买的记录ID
     getUserBuyRecordID:function(author){
        //钱包地址校验
        author = author.trim();
        if( !author || author === ""){
            throw new Error("请输入用户钱包地址");
        }
        //作者的购买过的所有id
        var buyIDs = this.userBuyRecordRepo.get(author)||[];
        return buyIDs;
     },

     /******************************
        6.某用户已付费的所有图片信息
     ******************************/
     //获取某用户的所有购买的图片信息
     getUserBuyAllImgID:function(author){
        //钱包地址校验
        author = author.trim();
        if( !author || author === ""){
            throw new Error("请输入用户钱包地址");
        }
        //所有交易记录的图片ID
        var userBuyImgIDs = this.userBuyImgRepo.get(author)||[];
        var result = [];
        for (var i = userBuyImgIDs.length - 1; i >= 0; i--) {
            var record = this.ImgRepo.get(userBuyImgIDs[i]);
            result.push(record);
        }
        return result;
     },
      //获取该用户的付费图片总条数
     getUserBuyImgNumber:function(author){
        //钱包地址校验
        author = author.trim();
        if( !author || author === ""){
            throw new Error("请输入用户钱包地址");
        }
        var result =  this.getUserBuyImgID ||[];
        return result.length;
     },
     //获取该用户所有付费图片的图片ID
     getUserBuyImgID:function(author){
        //钱包地址校验
        author = author.trim();
        if( !author || author === ""){
            throw new Error("请输入用户钱包地址");
        }
        var buyImgIDs = this.userBuyImgRepo.get(author)||[];
        return buyImgIDs;
     },
    
};
module.exports = HiThere;



