var intervalQuery=null;
var NebPay = require("nebpay");     //https://github.com/nebulasio/nebPay
var nebPay = new NebPay();
var serialNumber

var sourceUrl = null;
var adviceUrl = null;
var reader = new FileReader();
var pixelDolly1 = null;
var pixelOpts = [{resolution:10}];
reader.onload = function(e) {
	pixelDolly1 =null;
	var sucimg = $("#sucimg");
	sucimg.addClass("show").attr("src",e.target.result);
	var sucbox = $("#sucimg")[0];
	setTimeout(function(){
		sucbox.closePixelate(pixelOpts);
	},1000);
};
function creatImgData(){
	var canvas = document.getElementById("sucimg");
	if(!sourceUrl){
		alert("请上传图片！");
		return false;
	}
 	canvas.toBlob(function (blob) {
        var formdata = new FormData();
		formdata.append("file",blob);
		upImg(formdata,2);
    }, file.type || 'image/png');
}
function saveFun(obj){
 	if(obj){
 	   var to = dappAddress;
       var value = "0";
       var callFunction = "save";
       var timestamp = Date.parse(new Date());
       var callArgs = "[\""+ obj.adviceUrl + "\",\""+ obj.sourceUrl + "\",\""+ obj.setPrice + "\",\""+ obj.savetxt + "\"]";

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
                layer.msg('发布成功',function(){
				  location.href="list.html";
				});
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
function putSrver(){
	var savetxt = $("#savetxt").val();
	var setPrice = $("#setprice").val();
	if(!savetxt){
		alert("请填写留言！");
		return false;
	}
	if(!setPrice){
		alert("请填写价格！");
		return false;
	}
	var obj ={
		savetxt:savetxt,
		setPrice:setPrice,
		sourceUrl:sourceUrl,
		adviceUrl:adviceUrl
	};
	saveFun(obj);
	//上传数据
}

function upImg(data,type){
	$.ajax({
		type:"post",
		url:"http://yuebook.duapp.com/newserver/file2.php",
		async:true,
		data:data,
		processData : false,
		contentType : false, 
		success:function(data){
			var data = JSON.parse(data);
			if(data.code===200){
				if(type===1){
					sourceUrl = data.data.imgUrl;
				}else{
					adviceUrl = data.data.imgUrl;
					putSrver();
				}
			}else{
				layer.msg('图片上传失败，请重新上传');
			}
		},
		error:function(e){
			console.log(e);
		}
	});
}
$(function(){
	$("#file").bind("change",function(event){
		$("#sucimg").replaceWith("<img class=\"sucimg\" id=\"sucimg\" style=\"width:200px;height:200px;\" />");  
		file = event.target.files[0];
		var formdata = new FormData();
		formdata.append("file",file);
		upImg(formdata,1);
	    // 选择的文件是图片
	    if (file.type.indexOf("image") == 0) {
	        reader.readAsDataURL(file);    
	    }
	});
	$("#subInfo").bind("click",function(){
		creatImgData();
	});
});