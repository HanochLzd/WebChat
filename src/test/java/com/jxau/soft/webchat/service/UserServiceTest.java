package com.jxau.soft.webchat.service;

import com.jxau.soft.webchat.pojo.TbUser;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;


@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = {"classpath*:spring/applicationContext-*.xml"})
public class UserServiceTest {

    @Autowired
    private UserService userService;

    @Test
    public void queryUserByUserid() {
    }

    @Test
    public void update() {
        TbUser user = new TbUser();
        user.setUserId("test132");
        //user.getUserAge();
        //user.setUserAge(2);
        user.setUserStatus(1);
       // user.setUserProfile("测试内容！");
        int state = userService.update(user);
        System.out.println(state);
    }

    @Test
    public void addOne() {
    }
}