package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.Users;
import com.vizsgaremek.bookr.security.JWT;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class UsersService {

    public JSONObject getUserProfile(String token) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        Integer userId = JWT.getUserIdFromAccessToken(token);
        String userRoles = JWT.getRoleNameFromAccessToken(token);

        if (!userRoles.contains("client")) {
            status = "NoPermission";
            statusCode = 403;

            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }

        //code
        if (userId > 0) {
            Users modelResult = Users.getUserProfile(userId);

            JSONObject result = new JSONObject();
            result.put("id", modelResult.getId());
            result.put("firstName", modelResult.getFirstName());
            result.put("lastName", modelResult.getLastName());
            result.put("email", modelResult.getEmail());
            result.put("phone", modelResult.getPhone());
            result.put("imageUrl", modelResult.getImageUrl());
            result.put("createdAt", modelResult.getCreatedAt());

            toReturn.put("data", result);

        } else {
            status = "InvalidParamValue";
            statusCode = 417;
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);
        return toReturn;
    }

}
