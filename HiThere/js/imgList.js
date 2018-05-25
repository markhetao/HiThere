var anthor = "1";
var page =1;
var pageCount = 1;
var intervalQuery=null;
var NebPay = require("nebpay");     //https://github.com/nebulasio/nebPay
var nebPay = new NebPay();
var serialNumber

function getPage(){//获取总页数
	//搜索
    var from = Account.NewAccount().getAddressString();
    var value = "0";
    var nonce = "0";
    var gas_price = "1000000";
    var gas_limit = "2000000";
    var callFunction = "getImgTotalPage";
    var callArgs = "[]";
    var contract = {
      "function":callFunction,
      "args":callArgs
    }
    neb.api.call(from,dappAddress,value,nonce,gas_price,gas_limit,contract).then(
        function(resp){
        	pageCount = resp.result?resp.result:1;
    }).catch(function(err){
        console.log("error:"+err.message);
    })
}

function getData(anthor,page){
	var index = layer.load(1, {
	  shade: [0.5,'#000'] //0.1透明度的白色背景
	});
	//搜索
    var from = Account.NewAccount().getAddressString();
    var value = "0";
    var nonce = "0";
    var gas_price = "1000000";
    var gas_limit = "2000000";
    var callFunction = "getImgs";
    var callArgs = "[\""+ anthor + "\",\""+ page + "\"]";
    var contract = {
      "function":callFunction,
      "args":callArgs
    }
    neb.api.call(from,dappAddress,value,nonce,gas_price,gas_limit,contract).then(
        function(resp){
    	layer.close(index);
        dataCallBack(resp);
    }).catch(function(err){
        console.log("error:"+err.message);
    })
}

function dataCallBack(resp){
	var result = resp.result;
    if(result === 'null'){
    }else{
        try{
          result = JSON.parse(result);
          if(isArray(result)) {
          	var box= $("#list");
          	var htmlSrt = "";
          	if(result.length<=0){
          		$("#emptytip").addClass("show");
          		box.html("");
          		return false;
          	}
          	for(var i = 0;i<result.length;i++){
          		var d = result[i];
          		console.log(d);
          		console.log(d.vague);
          		htmlSrt+="<li id=\""+d.id+"\" staus=\""+d.status+"\">"+
							"<div class=\"imgbox\"><img src=\""+d.vague+"\" /></div>"+
							"<div class=\"info\">"+
								"<p class=\"t\">"+d.describe+"</p>"+
								"<p class=\"price\"><i class=\"moneyval\">"+(d.money/1e18)+"</i>NAS</p>"+
								"<p class=\"addr\">"+d.author+"</p>"+
							"</div>"+
						"</li>";
          }
          	$("#emptytip").removeClass("show");
          	box.html(htmlSrt);
          	addEvent();
      	}else{
            alert(result);
        };
        }catch(err){
        	
        }
    }
}
function addEvent(){
	$("#list li").bind("click",function(){
		var _self = $(this);
		var status =_self.attr("staus");
		if(status==0){
			var id = _self.attr("id");
			var money =_self.find(".moneyval").html();
			buyPower(id,money);
		}else{
			var obj = {
				imgUrl:_self.find("img").attr("src"),
				desc:_self.find(".t").html(),
				price:_self.find(".price").html(),
				addr:_self.find(".addr").html(),
			}
			lookDet(obj);
		}
	});
}
function lookDet(obj){
	var imgMask = $("#imgMask");
	var layBox = $("#layBox");
	layBox.html("");
	var htmlStr="<img src=\""+obj.imgUrl+"\" />"+
				"<div class=\"info\">"+
					"<p class=\"t\">"+obj.desc+"</p>"+
					"<p class=\"price\">"+obj.price+"</p>"+
					"<p class=\"addr\">"+obj.addr+"</p>"+
				"</div>";
	layBox.html(htmlStr);
	imgMask.addClass("show");
}
function buyPower(id,money){
	console.log(id);
 	if(id){
 	   var to = dappAddress;
       var value =money;
       var callFunction = "buy";
       var timestamp = Date.parse(new Date());
       var callArgs = "[\""+id+ "\"]";

       serialNumber = nebPay.call(to, value, callFunction, callArgs, {    //使用nebpay的call接口去调用合约,
        listener: cbPush        //设置listener, 处理交易返回信息
           });
     	}
   }
	function funcIntervalQuery(hash, type){
//	      nebPay.queryPayInfo(serialNumber)
//	          .then(function(resp){
//	            console.log("支付结果:"+resp);
//	            var respObject = JSON.parse(resp);
//	            if(respObject.data.status ===1){
//	              var author = $("#pathAddr").val().trim();
//	              getData(author);
//	            }
//	          }).catch(function(err){
//	            console.log(err);
//	          });
      
    $.ajax({
        type: "POST",
        url: "https://mainnet.nebulas.io/v1/user/getTransactionReceipt",
        data: JSON.stringify({
            hash: hash
        }),
        success: function (result) {
            if (result.result.status == 1) {
                clearInterval(intervalQuery);
                layer.msg('购买成功');
                getWallectInfo();
            }else if(result.result.status ==0){
            	layer.msg(result.execute_result);
            	console.log(result);
            	clearInterval(intervalQuery);
            }else{
            	console.log(result);
            	return ;
            }
        },
        error: function (jqXHR) {
        	clearInterval(intervalQuery);
            console.log(JSON.stringify(jqXHR));
        }
    });
}
function cbPush(resp){
    intervalQuery = setInterval(function () {
    funcIntervalQuery(resp.txhash);
    }, 5000);
}
function getWallectInfo() {
    window.postMessage({
        "target": "contentscript",
        "data": {},
        "method": "getAccount",
    }, "*");
    window.addEventListener('message', function (e) {
        if (e.data && e.data.data) {
            if (e.data.data.account) {//这就是当前钱包中的地址
            	anthor= e.data.data.account;
            	page = 1;
            	getData(anthor,page);
            }
        }
    });
}
$(function(){
	getPage();
	getData(anthor,page);
	$("#closebtn").click(function(){
		$(".Mask").removeClass("show");
	});
	$("#reloadData").bind("click",function(){
    	page = 1;
		anthor = $("#waddr").val().trim();
		if(!anthor){
			alert("请先输入钱包地址，然后点击刷新按钮！");
			return false;
		}
		getData(anthor,page);
	});
	page = $("#pageVal").html()?parseInt($("#pageVal").html()):1;
	var pagebox = $("#pageVal");
	$("#prev").click(function(){
		var page = parseInt(pagebox.html());
		if(page<=1){
			alert("已经是第一页了！");
			return false;
		}else{
			page-=1;
			pagebox.html(page);
			getData(anthor,page);
		}
	});
	$("#next").click(function(){
		console.log(pageCount);
		var page = parseInt(pagebox.html());
		if(page>=pageCount){
			alert("已经是最后一页了！");
			return false;
		}else{
			page+=1;
			pagebox.html(page);
			getData(anthor,page);
		}
	});
});