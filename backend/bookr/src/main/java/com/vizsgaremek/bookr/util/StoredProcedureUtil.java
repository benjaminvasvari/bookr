package com.vizsgaremek.bookr.util;

import javax.persistence.StoredProcedureQuery;

public class StoredProcedureUtil {
    
    public static void setNullableParameter(StoredProcedureQuery spq, String paramName, Object value) {
        if (value != null) {
            // Ha van érték, simán beállítjuk
            spq.setParameter(paramName, value);
        } else {
            // Ha NULL, előbb engedélyezzük a NULL passing-et
            spq.unwrap(org.hibernate.procedure.ProcedureCall.class)
               .getParameterRegistration(paramName)
               .enablePassingNulls(true);
            spq.setParameter(paramName, null);
        }
    }
}