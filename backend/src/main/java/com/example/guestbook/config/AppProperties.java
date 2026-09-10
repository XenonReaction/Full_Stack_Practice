package com.example.guestbook.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {

    /** Shared secret a submission must include to be accepted. */
    private String submissionPasscode;

    /** Browser origins allowed to call the API (CORS). */
    private List<String> corsAllowedOrigins = List.of();

    public String getSubmissionPasscode() {
        return submissionPasscode;
    }

    public void setSubmissionPasscode(String submissionPasscode) {
        this.submissionPasscode = submissionPasscode;
    }

    public List<String> getCorsAllowedOrigins() {
        return corsAllowedOrigins;
    }

    public void setCorsAllowedOrigins(List<String> corsAllowedOrigins) {
        this.corsAllowedOrigins = corsAllowedOrigins;
    }
}
