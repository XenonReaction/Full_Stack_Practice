package com.example.guestbook.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {

    /** Shared secret a submission must include to be accepted. */
    private String submissionPasscode;

    public String getSubmissionPasscode() {
        return submissionPasscode;
    }

    public void setSubmissionPasscode(String submissionPasscode) {
        this.submissionPasscode = submissionPasscode;
    }
}