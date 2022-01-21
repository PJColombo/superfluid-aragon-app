import React from 'react';
import { Button, Details, GU, Modal, RADIUS, textStyle, useLayout, useTheme } from '@aragon/ui';
import ErrorIcon from '../../assets/error-icon.svg';

const GenericError = ({ detailsTitle, detailsContent }) => {
  const theme = useTheme();

  return (
    <React.Fragment>
      <h1
        css={`
          color: ${theme.surfaceContent};
          ${textStyle('title2')};
          margin-bottom: ${1.5 * GU}px;
          text-align: center;
        `}
      >
        An unexpected error has occurred
      </h1>
      <p
        css={`
          margin-bottom: ${5 * GU}px;
          text-align: center;
          color: ${theme.surfaceContentSecondary};
          ${textStyle('body2')};
        `}
      >
        Something went wrong!
      </p>
      {(detailsTitle || detailsContent) && (
        <div
          css={`
            text-align: left;
            margin-bottom: ${5 * GU}px;
          `}
        >
          <Details label="Click here to see more">
            <div
              css={`
                overflow: auto;
                padding: ${2 * GU}px;
                max-height: 400px;
                border-radius: ${RADIUS}px;
                color: ${theme.text};
                white-space: pre;
                background: ${theme.surfaceUnder};
                ${textStyle('body3')};
              `}
            >
              {detailsTitle && (
                <h2
                  css={`
                    ${textStyle('body2')};
                    margin-bottom: ${1.5 * GU}px;
                  `}
                >
                  {detailsTitle}
                </h2>
              )}
              {detailsContent}
            </div>
          </Details>
        </div>
      )}
      <Button onClick={() => window.location.reload(true)} wide>
        Reload
      </Button>
    </React.Fragment>
  );
};

const ErrorModal = ({ detailsTitle, detailsContent }) => {
  const { layoutName } = useLayout();
  const compactMode = layoutName === 'small';
  const errorIconSize = compactMode ? '70px' : '100px';

  return (
    <Modal visible closeButton={false}>
      <div
        css={`
          display: block;
          padding: ${3 * GU}px ${4 * GU}px;
          width: 100%;
          max-width: ${72 * GU}px;
          height: auto;
          cursor: unset;
        `}
      >
        <img
          src={ErrorIcon}
          alt=""
          css={`
            width: ${errorIconSize};
            height: ${errorIconSize};
            margin: 0px auto 0px;
            display: block;
            border-radius: 20px;
            margin-bottom: ${3 * GU}px;
          `}
        />
        <GenericError detailsTitle={detailsTitle} detailsContent={detailsContent} />
      </div>
    </Modal>
  );
};

export default ErrorModal;
