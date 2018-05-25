 "use strict";

    var dappAddress = "n1s7g9Aefh1uYH3HWzHedJHNWqgxcabTeBi"; //主网环境
    // var dappAddress = "n228ztc3q3bnEMGhFYRo21zRjjFzyWPs9BB"; //测试合约
	var nebulas = require("nebulas"),
	    Account = nebulas.Account,
	    neb = new nebulas.Neb();
	neb.setRequest(new nebulas.HttpRequest("https://mainnet.nebulas.io"));// 
	 
	function isArray(obj){ 
	  return (typeof obj=='object')&&obj.constructor==Array; 
	};
	//获取url中的参数
	function getQueryString(name) {
	  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)","i"); // 匹配目标参数
	  var result = window.location.search.substr(1).match(reg); // 对querystring匹配目标参数
	  if (result != null) {
	    return decodeURIComponent(result[2]);
	  } else {
	    return null;
	  }
	}