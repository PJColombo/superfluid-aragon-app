import React, { useCallback, useState } from 'react';
import {
  Button,
  ButtonBase,
  GU,
  IconDown,
  Modal,
  RADIUS,
  textStyle,
  useLayout,
  useTheme,
} from '@aragon/ui';
import ErrorIcon from '../../assets/error-icon.svg';

const GenericError = ({ detailsTitle, detailsContent }) => {
  const theme = useTheme();
  const [opened, setOpened] = useState(false);

  const toggle = useCallback(() => {
    setOpened(prevOpened => !prevOpened);
  }, [setOpened]);

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
          <ButtonBase
            onClick={toggle}
            css={`
              display: flex;
              align-items: center;
              color: ${theme.surfaceContentSecondary};
              ${textStyle('label2')};
            `}
          >
            Click here to see more details
            <div
              css={`
                position: relative;
                top: ${opened ? '-4px' : '1px'};
                margin-left: ${0.5 * GU}px;
                transition: transform 150ms ease-in-out;
                transform: rotate3d(0, 0, 1, ${opened ? 180 : 0}deg);
              `}
            >
              <IconDown size="tiny" color={theme.surfaceContentSecondary} />
            </div>
          </ButtonBase>
          {opened && (
            <div
              css={`
                overflow: auto;
                padding: ${2 * GU}px;
                max-height: 200px;
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
          )}
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
