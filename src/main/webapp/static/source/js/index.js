/*
备用
 */
$(function () {
    context.init({preventDoubleContext: false});
    context.settings({compress: true});
    context.attach('#chat-view', [
        {header: '操作菜单'},
        {text: '清理', action: clearConsole},
        {divider: true},
        {
            text: '选项', subMenu: [
                {header: '连接选项'},
                {text: '检查', action: checkConnection},
                {text: '连接', action: getConnection},
                {text: '断开', action: closeConnection}
            ]
        },
        {
            text: '销毁菜单', action: function (e) {
                e.preventDefault();
                context.destroy('#chat-view');
            }
        }
    ]);
});
if ("${message}") {
    layer.msg('${message}', {
        offset: 0
    });
}
if ("${error}") {
    layer.msg('${error}', {
        offset: 0,
        shift: 6
    });
}
$("#tuling").click(function () {
    var onlinenum = $("#onlinenum").text();
    if ($(this).text() === "未上线") {
        $(this).text("已上线").removeClass("am-btn-danger").addClass("am-btn-success");
        showNotice("图灵机器人加入聊天室");
        $("#onlinenum").text(parseInt(onlinenum) + 1);
    }
    else {
        $(this).text("未上线").removeClass("am-btn-success").addClass("am-btn-danger");
        showNotice("图灵机器人离开聊天室");
        $("#onlinenum").text(parseInt(onlinenum) - 1)
    }
});
var wsServer = null;
var ws = null;
wsServer = "ws://" + location.host + "${pageContext.request.contextPath}" + "/chatServer";
ws = new WebSocket(wsServer); //创建WebSocket对象
ws.onopen = function (evt) {
    layer.msg("已经建立连接", {offset: 0});
};
ws.onmessage = function (evt) {
    analysisMessage(evt.data);  //解析后台传回的消息,并予以展示
};
ws.onerror = function (evt) {
    layer.msg("产生异常", {offset: 0});
};
ws.onclose = function (evt) {
    layer.msg("已经关闭连接", {offset: 0});
};

/**
 * 连接
 */
function getConnection() {
    if (ws == null) {
        ws = new WebSocket(wsServer); //创建WebSocket对象
        ws.onopen = function (evt) {
            layer.msg("成功建立连接!", {offset: 0});
        };
        ws.onmessage = function (evt) {
            analysisMessage(evt.data);  //解析后台传回的消息,并予以展示
        };
        ws.onerror = function (evt) {
            layer.msg("产生异常", {offset: 0});
        };
        ws.onclose = function (evt) {
            layer.msg("已经关闭连接", {offset: 0});
        };
    } else {
        layer.msg("连接已存在!", {offset: 0, shift: 6});
    }
}

/**
 * 关闭连接
 */
function closeConnection() {
    if (ws != null) {
        ws.close();
        ws = null;
        $("#list").html("");    //清空在线列表
        layer.msg("已经关闭连接", {offset: 0});
    } else {
        layer.msg("未开启连接", {offset: 0, shift: 6});
    }
}

/**
 * 检查连接
 */
function checkConnection() {
    if (ws != null) {
        layer.msg(ws.readyState === 0 ? "连接异常" : "连接正常", {offset: 0});
    } else {
        layer.msg("连接未开启!", {offset: 0, shift: 6});
    }
}

/**
 * 发送信息给后台
 */
function sendMessage() {
    if (ws == null) {
        layer.msg("连接未开启!", {offset: 0, shift: 6});
        return;
    }
    var message = $("#message").val();
    var to = $("#sendto").text() === "全体成员" ? "" : $("#sendto").text();
    if (message == null || message === "") {
        layer.msg("请不要惜字如金!", {offset: 0, shift: 6});
        return;
    }
    $("#tuling").text() === "已上线" ? tuling(message) : console.log("图灵机器人未开启");  //检测是否加入图灵机器人
    ws.send(JSON.stringify({
        message: {
            content: message,
            from: '${userid}',
            to: to,      //接收人,如果没有则置空,如果有多个接收人则用,分隔
            time: getDateFull()
        },
        type: "message"
    }));

    //将会话记录加入数据库中(只能单人单条，即：to中只有一个userid)
    //加入emoji支持
    if (to !== "") {
        $.ajax({
            url: "${pageContext.request.contextPath}/user/addRecord",
            type: "POST",
            traditional: true,
            contentType: "application/x-www-form-urlencoded;charset=utf-8",
            data: {
                fromUserId: '${userid}',
                toUserId: to,
                content: message,
                recordCreateTime: getDateFull()
            },
            dataType: "json",
            success: function (data) {
            },
            error: function () {
                layer.open({
                    title: '在线调试',
                    content: '聊天记录漫游失败！所以说这条记录消失了╮(╯▽╰)╭'
                });
            }
        });
    }
}

/**
 * 回车发送
 *
 * （利用ajax ， 每发送一条消息，往数据库中插入一条记录，json串）
 */
function keyDown(e) {
    var ev = window.event || e;
    //回车发送消息
    if (ev.keyCode === 13) {
        sendMessage();
    }
}

/**
 * 解析后台传来的消息
 * "massage" : {
     *              "from" : "xxx",
     *              "to" : "xxx",
     *              "content" : "xxx",
     *              "time" : "xxxx.xx.xx"
     *          },
 * "type" : {notice|message},
 * "list" : {[xx],[xx],[xx]}
 */
function analysisMessage(message) {
    message = JSON.parse(message);
    if (message.type === "message") {      //会话消息
        showChat(message.message);
    }
    if (message.type === "notice") {       //提示消息
        showNotice(message.message);
    }
    if (message.list != null && message.list !== undefined) {      //在线列表
        showOnline(message.list);
    }
}

/**
 * 展示提示信息
 */
function showNotice(notice) {
    $("#chat").append("<div><p class=\"am-text-success\" style=\"text-align:center\"><span class=\"am-icon-bell\"></span> " + notice + "</p></div>");
    var chat = $("#chat-view-main").children(".am-scrollable-vertical");
    chat.scrollTop(chat[0].scrollHeight);   //让聊天区始终滚动到最下面
}

/**
 * 展示会话信息
 */
function showChat(message) {
    //判断是否为当前div
    //如果是：则 1.直接向该div追加会话条目 2.用ajax（fetch）向后台发送已读信息
    //否：在在线列表对应的联系人展现红点提示以及出现右下角弹窗提示

    var to = message.to == null || message.to === "" ? "全体成员" : message.to;   //获取接收人

    var from = message.from;

    var chatdiv = $("#chat-view-main").children(".am-scrollable-vertical")[0];
    //确定再当前聊天页面
    if (chatdiv.id.indexOf('${userid}') >= 0 && chatdiv.id.indexOf(to) >= 0) {
        //确定接受者是当前用户
        if (to === '${userid}') {
            $.ajax({
                url: "${pageContext.request.contextPath}/user/readRecords",
                type: "POST",
                traditional: true,
                contentType: "application/x-www-form-urlencoded;charset=utf-8",
                data: {
                    fromUserId: message.from,
                    toUserId: to
                },
                success: function () {
                }
            });
        }
        var isSef = '${userid}' === message.from ? "am-comment-flip" : "";   //如果是自己则显示在右边,他人信息显示在左边
        var html = "<li class=\"am-comment " + isSef + " am-comment-primary\"><a href=\"#link-to-user-home\"><img width=\"48\" height=\"48\" class=\"am-comment-avatar\" alt=\"\" src=\"${ctx}/" + message.from + "/head\"></a><div class=\"am-comment-main\">\n" +
            "<header class=\"am-comment-hd\"><div class=\"am-comment-meta\">   <a class=\"am-comment-author\" href=\"#link-to-user\">" + message.from + "</a> 发表于<time> " + message.time + "</time> 发送给: " + to + " </div></header><div class=\"am-comment-bd\"> <p>" + message.content + "</p></div></div></li>";
        $("#chat").append(html);
        $("#message").val("");  //清空输入区
        var chat = $("#chat-view-main").children(".am-scrollable-vertical");
        chat.scrollTop(chat[0].scrollHeight);   //让聊天区始终滚动到最下面

    } else {
        //获取接收者的li

    }

}

/**
 * 展示在线列表
 */
function showOnline(list) {
    $("#list").html("");    //清空在线列表
    $.each(list, function (index, item) {     //添加私聊按钮
        var li = "<li>" + item + "<i class=\"am-icon-refresh am-icon-spin\"></i></li>";
        if ('${userid}' !== item) {    //排除自己
            li = "<li>" + item + " <button type=\"button\" class=\"am-btn am-btn-xs am-btn-primary am-round\" onclick=\"addChat('" + item + "');\"><span class=\"am-icon-phone\"><span> 私聊</button></li>";
        }
        $("#list").append(li);
    });
    $("#onlinenum").text($("#list li").length);     //获取在线人数
}

/**
 * 图灵机器人
 * @param message
 */
function tuling(message) {
    var html;
    $.getJSON("http://www.tuling123.com/openapi/api?key=16e2d9f3ea554600ba167108c68e9b2f&info=" + message, function (data) {
        if (data.code === 100000) {
            html = "<li class=\"am-comment am-comment-primary\"><a href=\"#link-to-user-home\"><img width=\"48\" height=\"48\" class=\"am-comment-avatar\" alt=\"\" src=\"${ctx}/static/img/robot.jpg\"></a><div class=\"am-comment-main\">\n" +
                "<header class=\"am-comment-hd\"><div class=\"am-comment-meta\">   <a class=\"am-comment-author\" href=\"#link-to-user\">Robot</a> 发表于<time> " + getDateFull() + "</time> 发送给: ${userid}</div></header><div class=\"am-comment-bd\"> <p>" + data.text + "</p></div></div></li>";
        }
        if (data.code === 200000) {
            html = "<li class=\"am-comment am-comment-primary\"><a href=\"#link-to-user-home\"><img width=\"48\" height=\"48\" class=\"am-comment-avatar\" alt=\"\" src=\"${ctx}/static/img/robot.jpg\"></a><div class=\"am-comment-main\">\n" +
                "<header class=\"am-comment-hd\"><div class=\"am-comment-meta\">   <a class=\"am-comment-author\" href=\"#link-to-user\">Robot</a> 发表于<time> " + getDateFull() + "</time> 发送给: ${userid}</div></header><div class=\"am-comment-bd\"> <p>" + data.text + "</p><a href=\"" + data.url + "\" target=\"_blank\">" + data.url + "</a></div></div></li>";
        }
        $("#chat").append(html);
        var chat = $("#chat-view-main").children(".am-scrollable-vertical");
        chat.scrollTop(chat[0].scrollHeight);
        $("#message").val("");  //清空输入区
    });
}

/**
 * 添加接收人
 */
function addChat(user) {
    // Ajax 前后台交互
    // 在添加接收人的后
    // 1.刷新聊天区<div>。 补充：将当前div与当前会话进行绑定，即将其id改成特定值
    // 2.填充发送者和接受者双方的聊天记录。补充：将所有聊天记录变为已读
    // （这可以看做是每次点击接收者便创建一个房间，然后进行AA通讯）
    // 先抛弃多人聊天、群聊等等。

    //用户绑定会话div
    var chatdiv = $("#chat-view-main")[0];
    chatdiv.children[0].id = '${userid}' + '-chat-view-' + user;

    $.ajax({
        url: "${pageContext.request.contextPath}/user/records",
        type: "POST",
        traditional: true,
        contentType: "application/x-www-form-urlencoded;charset=utf-8",
        data: {
            fromUserId: '${userid}',
            toUserId: user
        },
        dataType: "json",
        success: function (data) {
            var chat = $("#chat");
            chat.html("");
            // layer.open({
            //     title: '在线调试',
            //     content: data[0].content+'--'+data[1].content
            // });
            for (var i = 0; i < data.length; i++) {
                var isSef = '${userid}' === data[i].fromUserId ? "am-comment-flip" : "";   //如果是自己则显示在右边,他人信息显示在左边
                var html = "<li class=\"am-comment " + isSef + " am-comment-primary\"><a href=\"#link-to-user-home\"><img width=\"48\" height=\"48\" class=\"am-comment-avatar\" alt=\"\" src=\"${ctx}/" + data[i].fromUserId + "/head\"></a><div class=\"am-comment-main\">\n" +
                    "<header class=\"am-comment-hd\"><div class=\"am-comment-meta\">   <a class=\"am-comment-author\" href=\"#link-to-user\">" + data[i].fromUserId + "</a> 发表于<time> " + data[i].recordCreateTime + "</time> 发送给: " + data[i].toUserId + " </div></header><div class=\"am-comment-bd\"> <p>" + data[i].content + "</p></div></div></li>";
                chat.append(html);
            }
            var chat = $("#chat-view-main").children(".am-scrollable-vertical");
            chat.scrollTop(chat[0].scrollHeight);   //让聊天区始终滚动到最下面（无效）
        },
        error: function () {
            var chat = $("#chat");
            chat.html("");
            // layer.open({
            //     title: '在线调试',
            //     content: '空记录！'
            // });
        }
    });
    var sendto = $("#sendto");
    //var receive = sendto.text() === "全体成员" ? "" : sendto.text() + ",";
    //目前只写one-to-one会话
    var receive = sendto.text();
    if (receive.indexOf(user) === -1) {    //排除重复
        sendto.text(user);
    }
}

/**
 * 清空聊天区
 */
function clearConsole() {
    $("#chat").html("");
}

function appendZero(s) {
    return ("00" + s).substr((s + "").length);
}  //补0函数

/**
 * 获取当前时间
 * @returns {string}
 */
function getDateFull() {
    var date = new Date();
    return date.getFullYear() + "-" + appendZero(date.getMonth() + 1) + "-" +
        appendZero(date.getDate()) + " " + appendZero(date.getHours()) + ":" +
        appendZero(date.getMinutes()) + ":" + appendZero(date.getSeconds());
}
