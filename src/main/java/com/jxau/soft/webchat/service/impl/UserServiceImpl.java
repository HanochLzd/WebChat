package com.jxau.soft.webchat.service.impl;

import com.jxau.soft.webchat.mapper.TbRelationMapper;
import com.jxau.soft.webchat.mapper.TbUserMapper;
import com.jxau.soft.webchat.po.TbRelation;
import com.jxau.soft.webchat.po.TbRelationExample;
import com.jxau.soft.webchat.po.TbUser;
import com.jxau.soft.webchat.service.UserService;
import com.jxau.soft.webchat.vo.Friend;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * @author Hanoch
 */
@Service
public class UserServiceImpl implements UserService {

    private final TbUserMapper tbUserMapper;

    @Autowired
    private TbRelationMapper relationMapper;

    @Autowired
    public UserServiceImpl(TbUserMapper tbUserMapper) {
        this.tbUserMapper = tbUserMapper;
    }


    @Override
    public TbUser queryUserByUserid(String userid) {
        return tbUserMapper.selectByPrimaryKey(userid);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int update(TbUser user) {
        return tbUserMapper.updateByPrimaryKeySelective(user);
    }

    @Override
    @Transactional(rollbackFor = RuntimeException.class)
    public int addOne(TbUser tbUser) {
        return tbUserMapper.insert(tbUser);
    }

    @Override
    public List<Friend> queryAllFriends(String onwerId) {
        TbRelationExample example = new TbRelationExample();
        TbRelationExample.Criteria criteria = example.createCriteria();
        criteria.andOwnerUserEqualTo(onwerId);
        List<TbRelation> relations = relationMapper.selectByExample(example);
        List<Friend> friends = new ArrayList<>();
        for (TbRelation relation : relations) {
            TbUser friendUser = tbUserMapper.selectByPrimaryKey(relation.getFriendUser());
            Friend friend = new Friend();
            friend.setFriendId(relation.getFriendUser());
            friend.setFriendNickName(friendUser.getUserNickName());
            friend.setFriendProfileHead(friendUser.getUserProfilehead());
            friend.setFriendLoginStatus(friendUser.getUserLoginStatus());
            friend.setGroup(relation.getGroup());
            friends.add(friend);
        }
        return friends;
    }
}
